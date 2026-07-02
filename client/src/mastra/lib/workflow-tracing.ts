import type { TracingContext } from "@mastra/core/observability";

type WorkflowStepTracing = {
    tracingContext?: TracingContext;
};

export function withWorkflowTracing(step: WorkflowStepTracing) {
    return step.tracingContext ? { tracingContext: step.tracingContext } : {};
}

export function buildTriageTracingOptions(input: {
    conversationId: string;
    triggerMessageId: string;
    navigatorId: string;
}) {
    return {
        metadata: {
            conversationId: input.conversationId,
            triggerMessageId: input.triggerMessageId,
            navigatorId: input.navigatorId,
        },
        tags: ["message-triage", "agent-mode"],
    };
}
