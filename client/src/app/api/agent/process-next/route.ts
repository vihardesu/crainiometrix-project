import { NextResponse } from "next/server";
import { getSessionNavigatorId } from "@/lib/auth/session";
import { fetchNavigatorProfileIdAdmin, fetchNavigatorSettingsAdmin, fetchNextUnreadInboundMessage } from "@/lib/messaging/server-queries";
import type { ProcessNextResponse } from "@/lib/messaging/types";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST() {
    const sessionId = await getSessionNavigatorId();

    if (!sessionId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const profileId = await fetchNavigatorProfileIdAdmin(supabase, sessionId);

    if (!profileId) {
        return NextResponse.json({ error: "Navigator profile not found" }, { status: 404 });
    }

    const settings = await fetchNavigatorSettingsAdmin(supabase, profileId);

    if (!settings?.ai_mode_enabled) {
        const response: ProcessNextResponse = { done: true };
        return NextResponse.json(response);
    }

    const nextMessage = await fetchNextUnreadInboundMessage(supabase, profileId);

    if (!nextMessage) {
        const response: ProcessNextResponse = { done: true };
        return NextResponse.json(response);
    }

    // Stub: Mastra workflow will process this message in the next phase.
    const response: ProcessNextResponse = {
        done: false,
        status: "idle",
        processingConversationId: nextMessage.conversationId,
        triggerMessageId: nextMessage.messageId,
    };

    return NextResponse.json(response);
}
