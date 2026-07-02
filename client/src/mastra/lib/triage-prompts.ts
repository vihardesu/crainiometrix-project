import type { AgentCategory } from "../schemas/triage-schemas";
import type { WorkflowInput } from "../schemas/triage-schemas";

function formatRecentMessages(input: WorkflowInput): string {
    if (input.recentMessages.length === 0) {
        return "No prior messages.";
    }

    return input.recentMessages
        .map((message) => `[${message.role}] ${message.body}`)
        .join("\n");
}

export function buildCategoryPrompt(input: WorkflowInput): string {
    return `Classify this inbound message.

Participant: ${input.participantContext.fullName} (${input.participantContext.role})
${input.participantContext.patientName ? `Patient: ${input.participantContext.patientName}` : ""}

Recent conversation:
${formatRecentMessages(input)}

Message to classify:
${input.messageBody}`;
}

export function buildUrgencyPrompt(input: WorkflowInput): string {
    return `Classify urgency for this inbound message.

Participant: ${input.participantContext.fullName} (${input.participantContext.role})

Recent conversation:
${formatRecentMessages(input)}

Message to classify:
${input.messageBody}`;
}

export function buildDecisionPrompt(
    input: WorkflowInput,
    category: AgentCategory,
    categoryRationale: string,
    urgency: string,
    urgencyRationale: string,
): string {
    return `Route this message for AI triage.

Participant: ${input.participantContext.fullName} (${input.participantContext.role})
${input.participantContext.patientName ? `Patient: ${input.participantContext.patientName}` : ""}

Category: ${category}
Category rationale: ${categoryRationale}

Urgency: ${urgency}
Urgency rationale: ${urgencyRationale}

Recent conversation:
${formatRecentMessages(input)}

Message:
${input.messageBody}`;
}

export function buildDraftPrompt(
    input: WorkflowInput,
    category: AgentCategory,
    urgency: string,
    summary: string,
): string {
    return `Draft a reply for this care navigation conversation.

Classification: ${category} / ${urgency}
Routing summary: ${summary}

Use tools to gather context and resources before writing.

Participant context tool input:
${JSON.stringify(input.participantContext)}

Conversation history tool input:
${JSON.stringify({ recentMessages: input.recentMessages })}

Suggested resource topic: ${mapCategoryToResourceTopic(category)}

Inbound message to respond to:
${input.messageBody}`;
}

function mapCategoryToResourceTopic(category: AgentCategory): string {
    switch (category) {
        case "Scheduling":
            return "scheduling";
        case "Referral":
            return "referral";
        case "Transportation":
            return "transportation";
        case "Non-Clinical":
            return "non-clinical";
        case "Clinical":
            return "clinical-guidance";
    }
}
