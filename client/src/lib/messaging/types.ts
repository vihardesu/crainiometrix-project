import type { Tables } from "./database.types";

export type Profile = Tables<"profiles">;
export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;
export type NavigatorSettings = Tables<"navigator_settings">;
export type AgentAction = Tables<"agent_actions">;

export type ParticipantRole = "patient" | "caregiver";

export type AgentCategory = "Scheduling" | "Clinical" | "Referral" | "Non-Clinical" | "Transportation";
export type AgentUrgency = "Urgent" | "Non-Urgent";
export type AgentDecision = "AI" | "Human" | "Escalate" | "Indeterminate";
export type AgentActionStatus = "processing" | "completed" | "failed";

export type ConversationWithParticipant = Conversation & {
    participant: Profile;
};

export type MessageWithSender = Message & {
    sender: Pick<Profile, "id" | "full_name" | "role">;
};

export type MessageWithAgentAction = MessageWithSender & {
    agent_action?: AgentAction | null;
};

export type UnreadInboundMessage = {
    messageId: string;
    conversationId: string;
    body: string;
    createdAt: string;
};

export type ProcessNextResponse = {
    done: boolean;
    status?: "idle" | "processing";
    processingConversationId?: string;
    triggerMessageId?: string;
    agentActionId?: string;
};
