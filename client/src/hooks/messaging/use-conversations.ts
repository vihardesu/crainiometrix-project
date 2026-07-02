"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { fetchConversations, fetchNavigatorProfileId, sortConversations } from "@/lib/messaging/queries";
import type { ConversationWithParticipant } from "@/lib/messaging/types";

export function useConversations(navigatorExternalId: string) {
    const [conversations, setConversations] = useState<ConversationWithParticipant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const profileId = await fetchNavigatorProfileId(navigatorExternalId);

            if (!profileId) {
                setError("Navigator profile not found.");
                setConversations([]);
                return;
            }

            const data = await fetchConversations(profileId);
            setConversations(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load conversations.");
        } finally {
            setIsLoading(false);
        }
    }, [navigatorExternalId]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        let cancelled = false;
        const supabase = createClient();

        async function subscribe() {
            const profileId = await fetchNavigatorProfileId(navigatorExternalId);

            if (cancelled || !profileId) {
                return;
            }

            const channelName = `conversations:${profileId}`;

            // Drop any leftover channel from a prior mount (e.g. React Strict Mode).
            const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
            if (existing) {
                await supabase.removeChannel(existing);
            }

            if (cancelled) {
                return;
            }

            const channel = supabase
                .channel(channelName)
                .on(
                    "postgres_changes",
                    { event: "*", schema: "public", table: "conversations", filter: `navigator_id=eq.${profileId}` },
                    () => {
                        void load();
                    },
                )
                .subscribe();

            if (cancelled) {
                await supabase.removeChannel(channel);
            }
        }

        void subscribe();

        return () => {
            cancelled = true;
            for (const channel of supabase.getChannels()) {
                if (channel.topic.startsWith("realtime:conversations:")) {
                    void supabase.removeChannel(channel);
                }
            }
        };
    }, [navigatorExternalId, load]);

    return { conversations: sortConversations(conversations), isLoading, error, refresh: load };
}
