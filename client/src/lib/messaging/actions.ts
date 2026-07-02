"use server";

import { revalidatePath } from "next/cache";
import { getSessionNavigator } from "@/lib/auth/session";
import { createAdminClient } from "@/utils/supabase/admin";

async function requireNavigatorProfileId() {
    const navigator = await getSessionNavigator();

    if (!navigator) {
        throw new Error("Unauthorized");
    }

    const supabase = createAdminClient();
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("external_id", navigator.id)
        .maybeSingle();

    if (error || !profile) {
        throw new Error("Navigator profile not found");
    }

    return { navigator, profileId: profile.id };
}

async function isAiModeEnabled(profileId: string): Promise<boolean> {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("navigator_settings")
        .select("ai_mode_enabled")
        .eq("navigator_id", profileId)
        .maybeSingle();

    return data?.ai_mode_enabled ?? false;
}

export async function getNavigatorSettings() {
    const { profileId } = await requireNavigatorProfileId();
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("navigator_settings")
        .select("ai_mode_enabled, updated_at")
        .eq("navigator_id", profileId)
        .maybeSingle();

    if (error) {
        return { error: error.message };
    }

    return {
        aiModeEnabled: data?.ai_mode_enabled ?? false,
        updatedAt: data?.updated_at ?? null,
    };
}

export async function setAiModeEnabled(enabled: boolean) {
    const { profileId } = await requireNavigatorProfileId();
    const supabase = createAdminClient();

    const { error } = await supabase.from("navigator_settings").upsert(
        {
            navigator_id: profileId,
            ai_mode_enabled: enabled,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "navigator_id" },
    );

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/messages");
    return { success: true, aiModeEnabled: enabled };
}

export async function escalateConversation(conversationId: string) {
    const { profileId } = await requireNavigatorProfileId();
    const supabase = createAdminClient();

    const { error } = await supabase
        .from("conversations")
        .update({ is_escalated: true })
        .eq("id", conversationId)
        .eq("navigator_id", profileId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/messages");
    return { success: true };
}

export async function sendNavigatorMessage(conversationId: string, body: string) {
    const trimmed = body.trim();

    if (!trimmed) {
        return { error: "Message cannot be empty." };
    }

    const { profileId } = await requireNavigatorProfileId();

    if (await isAiModeEnabled(profileId)) {
        return { error: "AI mode is active. Turn off AI mode to send messages manually." };
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: profileId,
        sender_role: "navigator",
        body: trimmed,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/messages");
    return { success: true };
}

export async function sendParticipantMessage(conversationId: string, participantId: string, body: string) {
    const trimmed = body.trim();

    if (!trimmed) {
        return { error: "Message cannot be empty." };
    }

    await requireNavigatorProfileId();
    const supabase = createAdminClient();

    const { data: participant, error: participantError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", participantId)
        .in("role", ["patient", "caregiver"])
        .maybeSingle();

    if (participantError || !participant) {
        return { error: "Participant not found." };
    }

    const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: participant.id,
        sender_role: participant.role,
        body: trimmed,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/admin");
    revalidatePath("/messages");
    return { success: true };
}

export async function markConversationRead(conversationId: string) {
    const { profileId } = await requireNavigatorProfileId();

    if (await isAiModeEnabled(profileId)) {
        return { success: true };
    }

    const supabase = createAdminClient();

    const { error: messagesError } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_role", "navigator")
        .is("read_at", null);

    if (messagesError) {
        return { error: messagesError.message };
    }

    const { error: conversationError } = await supabase
        .from("conversations")
        .update({ unread_count: 0 })
        .eq("id", conversationId);

    if (conversationError) {
        return { error: conversationError.message };
    }

    revalidatePath("/messages");
    return { success: true };
}

export async function getOrCreateConversation(participantId: string) {
    const { profileId } = await requireNavigatorProfileId();
    const supabase = createAdminClient();

    const { data: existing, error: existingError } = await supabase
        .from("conversations")
        .select("id")
        .eq("navigator_id", profileId)
        .eq("participant_id", participantId)
        .maybeSingle();

    if (existingError) {
        return { error: existingError.message };
    }

    if (existing) {
        return { conversationId: existing.id };
    }

    const { data: created, error: createError } = await supabase
        .from("conversations")
        .insert({
            navigator_id: profileId,
            participant_id: participantId,
        })
        .select("id")
        .single();

    if (createError || !created) {
        return { error: createError?.message ?? "Failed to create conversation." };
    }

    revalidatePath("/messages");
    return { conversationId: created.id };
}
