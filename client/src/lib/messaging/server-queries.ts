import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { sortConversations } from "./queries";
import type { ConversationWithParticipant, UnreadInboundMessage } from "./types";

type AdminClient = SupabaseClient<Database>;

export async function fetchNavigatorProfileIdAdmin(supabase: AdminClient, externalId: string): Promise<string | null> {
    const { data, error } = await supabase.from("profiles").select("id").eq("external_id", externalId).maybeSingle();

    if (error) {
        throw error;
    }

    return data?.id ?? null;
}

export async function fetchNavigatorSettingsAdmin(
    supabase: AdminClient,
    navigatorProfileId: string,
): Promise<{ ai_mode_enabled: boolean } | null> {
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

export async function fetchNextUnreadInboundMessage(
    supabase: AdminClient,
    navigatorProfileId: string,
): Promise<UnreadInboundMessage | null> {
    const { data: conversations, error: conversationsError } = await supabase
        .from("conversations")
        .select(
            `
            id,
            unread_count,
            last_message_at,
            participant:profiles!conversations_participant_id_fkey (*)
        `,
        )
        .eq("navigator_id", navigatorProfileId)
        .gt("unread_count", 0);

    if (conversationsError) {
        throw conversationsError;
    }

    const sorted = sortConversations((conversations ?? []) as ConversationWithParticipant[]);

    for (const conversation of sorted) {
        const { data: messages, error: messagesError } = await supabase
            .from("messages")
            .select("id, body, created_at, conversation_id")
            .eq("conversation_id", conversation.id)
            .neq("sender_role", "navigator")
            .is("read_at", null)
            .order("created_at", { ascending: true })
            .limit(1);

        if (messagesError) {
            throw messagesError;
        }

        const message = messages?.[0];

        if (message) {
            return {
                messageId: message.id,
                conversationId: message.conversation_id,
                body: message.body,
                createdAt: message.created_at,
            };
        }
    }

    return null;
}
