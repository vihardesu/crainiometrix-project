import { createClient } from "@/utils/supabase/client";
import type { ConversationWithParticipant, MessageWithSender, Profile, AgentAction } from "./types";

export function sortConversations(conversations: ConversationWithParticipant[]): ConversationWithParticipant[] {
    return [...conversations].sort((a, b) => {
        const aUnread = a.unread_count > 0 ? 1 : 0;
        const bUnread = b.unread_count > 0 ? 1 : 0;

        if (aUnread !== bUnread) {
            return bUnread - aUnread;
        }

        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;

        return bTime - aTime;
    });
}

export async function fetchNavigatorProfileId(externalId: string): Promise<string | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from("profiles").select("id").eq("external_id", externalId).maybeSingle();

    if (error) {
        throw error;
    }

    return data?.id ?? null;
}

export async function fetchConversations(navigatorProfileId: string): Promise<ConversationWithParticipant[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("conversations")
        .select(
            `
            *,
            participant:profiles!conversations_participant_id_fkey (*)
        `,
        )
        .eq("navigator_id", navigatorProfileId);

    if (error) {
        throw error;
    }

    return sortConversations((data ?? []) as ConversationWithParticipant[]);
}

export async function fetchMessages(conversationId: string): Promise<MessageWithSender[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("messages")
        .select(
            `
            *,
            sender:profiles!messages_sender_id_fkey (id, full_name, role)
        `,
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    return (data ?? []) as MessageWithSender[];
}

export async function fetchParticipants(): Promise<Profile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["patient", "caregiver"])
        .order("full_name", { ascending: true });

    if (error) {
        throw error;
    }

    return data ?? [];
}

export async function fetchNavigatorSettings(navigatorProfileId: string): Promise<{ ai_mode_enabled: boolean } | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("navigator_settings")
        .select("ai_mode_enabled")
        .eq("navigator_id", navigatorProfileId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

export async function fetchAgentActionsForConversation(conversationId: string): Promise<AgentAction[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("agent_actions")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    return data ?? [];
}

