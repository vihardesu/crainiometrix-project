import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { extractAgentToolCalls } from "../lib/extract-tool-calls";
import { withWorkflowTracing } from "../lib/workflow-tracing";
import {
    buildCategoryPrompt,
    buildDecisionPrompt,
    buildDraftPrompt,
    buildUrgencyPrompt,
} from "../lib/triage-prompts";
import {
    categoryClassificationSchema,
    participantContextSchema,
    triageDecisionSchema,
    urgencyClassificationSchema,
    workflowInputSchema,
    workflowOutputSchema,
    type WorkflowInput,
} from "../schemas/triage-schemas";

const triageStateSchema = z.object({
    conversationId: z.string(),
    triggerMessageId: z.string(),
    messageBody: z.string(),
    recentMessages: workflowInputSchema.shape.recentMessages,
    category: categoryClassificationSchema.shape.category,
    categoryRationale: z.string(),
    urgency: urgencyClassificationSchema.shape.urgency,
    urgencyRationale: z.string(),
    participantContext: participantContextSchema,
    decision: triageDecisionSchema.shape.decision,
    summary: z.string(),
});

const classifyCategoryStep = createStep({
    id: "classify-category",
    description: "Classifies the inbound message into a care navigation category",
    inputSchema: workflowInputSchema,
    outputSchema: categoryClassificationSchema,
    execute: async ({ inputData, mastra, tracingContext }) => {
        const agent = mastra?.getAgent("categoryClassifierAgent");

        if (!agent) {
            throw new Error("Category classifier agent not found");
        }

        const result = await agent.generate(buildCategoryPrompt(inputData), {
            structuredOutput: { schema: categoryClassificationSchema },
            ...withWorkflowTracing({ tracingContext }),
        });

        if (!result.object) {
            throw new Error("Category classifier returned no structured output");
        }

        return result.object;
    },
});

const classifyUrgencyStep = createStep({
    id: "classify-urgency",
    description: "Classifies whether the inbound message is urgent",
    inputSchema: workflowInputSchema,
    outputSchema: urgencyClassificationSchema,
    execute: async ({ inputData, mastra, tracingContext }) => {
        const agent = mastra?.getAgent("urgencyClassifierAgent");

        if (!agent) {
            throw new Error("Urgency classifier agent not found");
        }

        const result = await agent.generate(buildUrgencyPrompt(inputData), {
            structuredOutput: { schema: urgencyClassificationSchema },
            ...withWorkflowTracing({ tracingContext }),
        });

        if (!result.object) {
            throw new Error("Urgency classifier returned no structured output");
        }

        return result.object;
    },
});

const fetchParticipantContextStep = createStep({
    id: "fetch-participant-context",
    description: "Passes through participant context supplied with workflow input",
    inputSchema: workflowInputSchema,
    outputSchema: participantContextSchema,
    execute: async ({ inputData }) => inputData.participantContext,
});

const triageDecisionStep = createStep({
    id: "triage-decision",
    description: "Decides whether to auto-respond, escalate, defer to human, or mark indeterminate",
    inputSchema: z.object({
        "classify-category": categoryClassificationSchema,
        "classify-urgency": urgencyClassificationSchema,
        "fetch-participant-context": participantContextSchema,
    }),
    outputSchema: triageStateSchema,
    execute: async ({ inputData, getInitData, mastra, tracingContext }) => {
        const initData = getInitData<WorkflowInput>();
        const categoryResult = inputData["classify-category"];
        const urgencyResult = inputData["classify-urgency"];
        const participantContext = inputData["fetch-participant-context"];

        const agent = mastra?.getAgent("triageDecisionAgent");

        if (!agent) {
            throw new Error("Triage decision agent not found");
        }

        const result = await agent.generate(
            buildDecisionPrompt(
                initData,
                categoryResult.category,
                categoryResult.rationale,
                urgencyResult.urgency,
                urgencyResult.rationale,
            ),
            {
                structuredOutput: { schema: triageDecisionSchema },
                ...withWorkflowTracing({ tracingContext }),
            },
        );

        if (!result.object) {
            throw new Error("Triage decision agent returned no structured output");
        }

        return {
            conversationId: initData.conversationId,
            triggerMessageId: initData.triggerMessageId,
            messageBody: initData.messageBody,
            recentMessages: initData.recentMessages,
            category: categoryResult.category,
            categoryRationale: categoryResult.rationale,
            urgency: urgencyResult.urgency,
            urgencyRationale: urgencyResult.rationale,
            participantContext,
            decision: result.object.decision,
            summary: result.object.summary,
        };
    },
});

function buildWorkflowOutput(
    state: z.infer<typeof triageStateSchema>,
    extras?: { draftResponse?: string; toolCalls?: Array<{ tool: string; input: unknown; output: unknown }> },
): z.infer<typeof workflowOutputSchema> {
    return {
        conversationId: state.conversationId,
        triggerMessageId: state.triggerMessageId,
        category: state.category,
        categoryRationale: state.categoryRationale,
        urgency: state.urgency,
        urgencyRationale: state.urgencyRationale,
        participantContext: state.participantContext,
        decision: state.decision,
        summary: state.summary,
        draftResponse: extras?.draftResponse,
        toolCalls: extras?.toolCalls,
    };
}

const draftResponseStep = createStep({
    id: "draft-response",
    description: "Sub-agent drafts an AI reply using care navigation tools",
    inputSchema: triageStateSchema,
    outputSchema: workflowOutputSchema,
    execute: async ({ inputData, getInitData, mastra, tracingContext }) => {
        const initData = getInitData<WorkflowInput>();
        const agent = mastra?.getAgent("responseDrafterAgent");

        if (!agent) {
            throw new Error("Response drafter agent not found");
        }

        const result = await agent.generate(
            buildDraftPrompt(initData, inputData.category, inputData.urgency, inputData.summary),
            {
                maxSteps: 8,
                ...withWorkflowTracing({ tracingContext }),
            },
        );

        return buildWorkflowOutput(inputData, {
            draftResponse: result.text,
            toolCalls: extractAgentToolCalls(result),
        });
    },
});

const humanDecisionStep = createStep({
    id: "human-decision",
    description: "Records that a human navigator must respond",
    inputSchema: triageStateSchema,
    outputSchema: workflowOutputSchema,
    execute: async ({ inputData }) => buildWorkflowOutput(inputData),
});

const escalateDecisionStep = createStep({
    id: "escalate-decision",
    description: "Records that the conversation should be escalated",
    inputSchema: triageStateSchema,
    outputSchema: workflowOutputSchema,
    execute: async ({ inputData }) => buildWorkflowOutput(inputData),
});

const indeterminateDecisionStep = createStep({
    id: "indeterminate-decision",
    description: "Records that triage could not reach a confident decision",
    inputSchema: triageStateSchema,
    outputSchema: workflowOutputSchema,
    execute: async ({ inputData }) => buildWorkflowOutput(inputData),
});

const messageTriageWorkflow = createWorkflow({
    id: "message-triage-workflow",
    description: "Triages inbound navigator messages and decides whether to auto-respond, escalate, or defer.",
    metadata: {
        domain: "messaging",
        feature: "agent-triage",
    },
    inputSchema: workflowInputSchema,
    outputSchema: workflowOutputSchema,
    options: {
        validateInputs: true,
    },
})
    .parallel([classifyCategoryStep, classifyUrgencyStep, fetchParticipantContextStep])
    .then(triageDecisionStep)
    .branch([
        [async ({ inputData }) => inputData.decision === "AI", draftResponseStep],
        [async ({ inputData }) => inputData.decision === "Human", humanDecisionStep],
        [async ({ inputData }) => inputData.decision === "Escalate", escalateDecisionStep],
        [async ({ inputData }) => inputData.decision === "Indeterminate", indeterminateDecisionStep],
    ])
    .commit();

export { messageTriageWorkflow };
