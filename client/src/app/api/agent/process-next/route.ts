import { NextResponse } from "next/server";
import { getSessionNavigatorId } from "@/lib/auth/session";
import {
    buildWorkflowInput,
    createProcessingAgentAction,
    markAgentActionFailed,
    persistTriageResult,
    runMessageTriageWorkflow,
} from "@/lib/messaging/agent-runner";
import {
    fetchExistingAgentActionForMessage,
    fetchNavigatorProfileIdAdmin,
    fetchNavigatorSettingsAdmin,
    fetchNextUnreadInboundMessage,
    hasUnreadInboundMessages,
} from "@/lib/messaging/server-queries";
import type { ProcessNextResponse } from "@/lib/messaging/types";
import { createAdminClient } from "@/utils/supabase/admin";

export const maxDuration = 60;

export async function POST() {
    const sessionId = await getSessionNavigatorId();

    if (!sessionId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const profileId = await fetchNavigatorProfileIdAdmin(supabase, sessionId);

    if (!profileId) {
        return NextResponse.json({ error: "Navigator profile not found" }, { status: 404 });
    }

    const settings = await fetchNavigatorSettingsAdmin(supabase, profileId);

    if (!settings?.ai_mode_enabled) {
        const response: ProcessNextResponse = { done: true };
        return NextResponse.json(response);
    }

    const nextMessage = await fetchNextUnreadInboundMessage(supabase, profileId);

    if (!nextMessage) {
        const response: ProcessNextResponse = { done: true };
        return NextResponse.json(response);
    }

    const existingAction = await fetchExistingAgentActionForMessage(supabase, nextMessage.messageId);

    if (existingAction) {
        const moreRemaining = await hasUnreadInboundMessages(supabase, profileId);
        const response: ProcessNextResponse = {
            done: !moreRemaining,
            status: "idle",
            processingConversationId: existingAction.conversation_id,
            triggerMessageId: existingAction.trigger_message_id,
            agentActionId: existingAction.id,
        };
        return NextResponse.json(response);
    }

    let agentActionId: string | null = null;

    try {
        agentActionId = await createProcessingAgentAction(
            supabase,
            profileId,
            nextMessage.conversationId,
            nextMessage.messageId,
        );

        const workflowInput = await buildWorkflowInput(supabase, profileId, nextMessage);
        const workflowOutput = await runMessageTriageWorkflow(workflowInput);
        await persistTriageResult(supabase, profileId, agentActionId, workflowOutput);

        const moreRemaining = await hasUnreadInboundMessages(supabase, profileId);
        const response: ProcessNextResponse = {
            done: !moreRemaining,
            status: "idle",
            processingConversationId: nextMessage.conversationId,
            triggerMessageId: nextMessage.messageId,
            agentActionId,
        };

        return NextResponse.json(response);
    } catch (error) {
        if (agentActionId) {
            await markAgentActionFailed(supabase, agentActionId, error);
        }

        console.error("Agent process-next failed:", error);
        return NextResponse.json({ error: "Failed to process message." }, { status: 500 });
    }
}
