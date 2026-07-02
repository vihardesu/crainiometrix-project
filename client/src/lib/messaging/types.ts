import type { Tables } from "./database.types";

export type Profile = Tables<"profiles">;
export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;

export type ParticipantRole = "patient" | "caregiver";

export type ConversationWithParticipant = Conversation & {
    participant: Profile;
};

export type MessageWithSender = Message & {
    sender: Pick<Profile, "id" | "full_name" | "role">;
};
