import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParticipantContext } from "@/mastra/schemas/triage-schemas";
import type { Database } from "./database.types";
import { sortConversations } from "./queries";
import type { ConversationWithParticipant, Profile, UnreadInboundMessage } from "./types";

type AdminClient = SupabaseClient<Database>;

export type TriageContext = {
    participantContext: ParticipantContext;
};

export type RecentMessageForTriage = {
    role: "patient" | "caregiver" | "navigator";
    body: string;
    createdAt: string;
};

export type ExistingAgentAction = {
    id: string;
    status: string;
    conversation_id: string;
    trigger_message_id: string;
};

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
            .order("created_at", { ascending: true });

        if (messagesError) {
            throw messagesError;
        }

        for (const message of messages ?? []) {
            const existingAction = await fetchExistingAgentActionForMessage(supabase, message.id);

            if (existingAction) {
                continue;
            }

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

export async function fetchExistingAgentActionForMessage(
    supabase: AdminClient,
    triggerMessageId: string,
): Promise<ExistingAgentAction | null> {
    const { data, error } = await supabase
        .from("agent_actions")
        .select("id, status, conversation_id, trigger_message_id")
        .eq("trigger_message_id", triggerMessageId)
        .in("status", ["processing", "completed"])
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

export async function fetchTriageContextAdmin(
    supabase: AdminClient,
    conversationId: string,
): Promise<TriageContext | null> {
    const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .select(
            `
            id,
            participant:profiles!conversations_participant_id_fkey (*)
        `,
        )
        .eq("id", conversationId)
        .maybeSingle();

    if (conversationError) {
        throw conversationError;
    }

    const participant = conversation?.participant as Profile | undefined;

    if (!participant || (participant.role !== "patient" && participant.role !== "caregiver")) {
        return null;
    }

    let patientName: string | null = null;
    let patientId: string | null = null;

    if (participant.role === "caregiver" && participant.patient_id) {
        patientId = participant.patient_id;

        const { data: patient, error: patientError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", participant.patient_id)
            .maybeSingle();

        if (patientError) {
            throw patientError;
        }

        patientName = patient?.full_name ?? null;
    }

    if (participant.role === "patient") {
        patientId = participant.id;
        patientName = participant.full_name;
    }

    return {
        participantContext: {
            fullName: participant.full_name,
            role: participant.role,
            patientName,
            patientId,
        },
    };
}

export async function fetchRecentMessagesAdmin(
    supabase: AdminClient,
    conversationId: string,
    limit = 10,
): Promise<RecentMessageForTriage[]> {
    const { data, error } = await supabase
        .from("messages")
        .select("sender_role, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        throw error;
    }

    return (data ?? [])
        .reverse()
        .map((message) => ({
            role: message.sender_role as RecentMessageForTriage["role"],
            body: message.body,
            createdAt: message.created_at,
        }));
}

export async function syncConversationUnreadCount(supabase: AdminClient, conversationId: string): Promise<void> {
    const { count, error: countError } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversationId)
        .neq("sender_role", "navigator")
        .is("read_at", null);

    if (countError) {
        throw countError;
    }

    const { error: updateError } = await supabase
        .from("conversations")
        .update({ unread_count: count ?? 0 })
        .eq("id", conversationId);

    if (updateError) {
        throw updateError;
    }
}

export async function hasUnreadInboundMessages(
    supabase: AdminClient,
    navigatorProfileId: string,
): Promise<boolean> {
    const next = await fetchNextUnreadInboundMessage(supabase, navigatorProfileId);
    return next !== null;
}
