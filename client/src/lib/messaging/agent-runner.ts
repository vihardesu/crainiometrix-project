import { mastra } from "@/mastra";
import { buildTriageTracingOptions } from "@/mastra/lib/workflow-tracing";
import type { WorkflowInput, WorkflowOutput } from "@/mastra/schemas/triage-schemas";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "./database.types";
import {
    fetchRecentMessagesAdmin,
    fetchTriageContextAdmin,
    syncConversationUnreadCount,
} from "./server-queries";
import type { UnreadInboundMessage, AgentActionMetadata } from "./types";

type AdminClient = SupabaseClient<Database>;

export async function buildWorkflowInput(
    supabase: AdminClient,
    navigatorId: string,
    nextMessage: UnreadInboundMessage,
): Promise<WorkflowInput> {
    const triageContext = await fetchTriageContextAdmin(supabase, nextMessage.conversationId);

    if (!triageContext) {
        throw new Error("Triage context not found for conversation.");
    }

    const recentMessages = await fetchRecentMessagesAdmin(supabase, nextMessage.conversationId);

    return {
        conversationId: nextMessage.conversationId,
        navigatorId,
        triggerMessageId: nextMessage.messageId,
        messageBody: nextMessage.body,
        recentMessages: recentMessages as WorkflowInput["recentMessages"],
        participantContext: triageContext.participantContext,
    };
}

export async function runMessageTriageWorkflow(input: WorkflowInput): Promise<WorkflowOutput> {
    const workflow = mastra.getWorkflow("messageTriageWorkflow");
    const run = await workflow.createRun();
    const result = await run.start({
        inputData: input,
        tracingOptions: buildTriageTracingOptions(input),
    });

    if (result.status !== "success") {
        const errorMessage =
            result.status === "failed" && "error" in result && result.error
                ? String(result.error)
                : `Workflow ended with status: ${result.status}`;
        throw new Error(errorMessage);
    }

    if (!result.result) {
        throw new Error("Workflow completed without a result.");
    }

    return result.result as WorkflowOutput;
}

export async function persistTriageResult(
    supabase: AdminClient,
    navigatorId: string,
    agentActionId: string,
    output: WorkflowOutput,
): Promise<void> {
    const completedAt = new Date().toISOString();
    const actionMetadata: AgentActionMetadata = {
        categoryRationale: output.categoryRationale,
        urgencyRationale: output.urgencyRationale,
        toolCalls: output.toolCalls ?? [],
    };
    const metadata = JSON.parse(JSON.stringify(actionMetadata)) as Json;

    let responseMessageId: string | null = null;

    if (output.decision === "AI") {
        if (!output.draftResponse?.trim()) {
            throw new Error("AI decision requires a draft response.");
        }

        const { data: responseMessage, error: insertError } = await supabase
            .from("messages")
            .insert({
                conversation_id: output.conversationId,
                sender_id: navigatorId,
                sender_role: "navigator",
                body: output.draftResponse.trim(),
                is_ai_generated: true,
            })
            .select("id")
            .single();

        if (insertError || !responseMessage) {
            throw insertError ?? new Error("Failed to insert AI response message.");
        }

        responseMessageId = responseMessage.id;

        const { error: readError } = await supabase
            .from("messages")
            .update({ read_at: completedAt })
            .eq("id", output.triggerMessageId);

        if (readError) {
            throw readError;
        }

        await syncConversationUnreadCount(supabase, output.conversationId);
    }

    if (output.decision === "Escalate") {
        const { error: escalateError } = await supabase
            .from("conversations")
            .update({ is_escalated: true })
            .eq("id", output.conversationId);

        if (escalateError) {
            throw escalateError;
        }
    }

    const { error: updateError } = await supabase
        .from("agent_actions")
        .update({
            status: "completed",
            category: output.category,
            urgency: output.urgency,
            decision: output.decision,
            summary: output.summary,
            response_message_id: responseMessageId,
            metadata,
            completed_at: completedAt,
        })
        .eq("id", agentActionId);

    if (updateError) {
        throw updateError;
    }
}

export async function markAgentActionFailed(
    supabase: AdminClient,
    agentActionId: string,
    error: unknown,
): Promise<void> {
    const message = error instanceof Error ? error.message : "Unknown agent processing error.";

    await supabase
        .from("agent_actions")
        .update({
            status: "failed",
            summary: message,
            metadata: { error: message },
            completed_at: new Date().toISOString(),
        })
        .eq("id", agentActionId);
}

export async function createProcessingAgentAction(
    supabase: AdminClient,
    navigatorId: string,
    conversationId: string,
    triggerMessageId: string,
): Promise<string> {
    const { data, error } = await supabase
        .from("agent_actions")
        .insert({
            navigator_id: navigatorId,
            conversation_id: conversationId,
            trigger_message_id: triggerMessageId,
            status: "processing",
        })
        .select("id")
        .single();

    if (error || !data) {
        throw error ?? new Error("Failed to create agent action.");
    }

    return data.id;
}
