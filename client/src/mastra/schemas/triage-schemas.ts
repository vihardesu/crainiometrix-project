import { z } from "zod";

export const agentCategorySchema = z.enum([
    "Scheduling",
    "Clinical",
    "Referral",
    "Non-Clinical",
    "Transportation",
]);

export const agentUrgencySchema = z.enum(["Urgent", "Non-Urgent"]);

export const agentDecisionSchema = z.enum(["AI", "Human", "Escalate", "Indeterminate"]);

export const participantRoleSchema = z.enum(["patient", "caregiver", "navigator"]);

export const recentMessageSchema = z.object({
    role: participantRoleSchema,
    body: z.string(),
    createdAt: z.string(),
});

export const participantContextSchema = z.object({
    fullName: z.string(),
    role: z.enum(["patient", "caregiver"]),
    patientName: z.string().nullable(),
    patientId: z.string().nullable(),
});

export const workflowInputSchema = z.object({
    conversationId: z.string(),
    navigatorId: z.string(),
    triggerMessageId: z.string(),
    messageBody: z.string(),
    recentMessages: z.array(recentMessageSchema),
    participantContext: participantContextSchema,
});

export const categoryClassificationSchema = z.object({
    category: agentCategorySchema,
    rationale: z.string(),
});

export const urgencyClassificationSchema = z.object({
    urgency: agentUrgencySchema,
    rationale: z.string(),
});

export const triageDecisionSchema = z.object({
    decision: agentDecisionSchema,
    summary: z.string(),
});

export const toolCallRecordSchema = z.object({
    tool: z.string(),
    input: z.unknown(),
    output: z.unknown(),
});

export const draftResponseSchema = z.object({
    draftResponse: z.string(),
});

export const workflowOutputSchema = z.object({
    conversationId: z.string(),
    triggerMessageId: z.string(),
    category: agentCategorySchema,
    categoryRationale: z.string(),
    urgency: agentUrgencySchema,
    urgencyRationale: z.string(),
    participantContext: participantContextSchema,
    decision: agentDecisionSchema,
    summary: z.string(),
    draftResponse: z.string().optional(),
    toolCalls: z.array(toolCallRecordSchema).optional(),
});

export const careResourceTopicSchema = z.enum([
    "scheduling",
    "referral",
    "transportation",
    "non-clinical",
    "clinical-guidance",
]);

export type AgentCategory = z.infer<typeof agentCategorySchema>;
export type AgentUrgency = z.infer<typeof agentUrgencySchema>;
export type AgentDecision = z.infer<typeof agentDecisionSchema>;
export type WorkflowInput = z.infer<typeof workflowInputSchema>;
export type WorkflowOutput = z.infer<typeof workflowOutputSchema>;
export type ParticipantContext = z.infer<typeof participantContextSchema>;
export type CategoryClassification = z.infer<typeof categoryClassificationSchema>;
export type UrgencyClassification = z.infer<typeof urgencyClassificationSchema>;
export type TriageDecision = z.infer<typeof triageDecisionSchema>;
