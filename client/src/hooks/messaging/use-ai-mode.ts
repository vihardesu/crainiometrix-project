"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { fetchNavigatorProfileId, fetchNavigatorSettings } from "@/lib/messaging/queries";
import { setAiModeEnabled } from "@/lib/messaging/actions";

export function useAiMode(navigatorExternalId: string) {
    const [enabled, setEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const load = useCallback(async () => {
        try {
            const profileId = await fetchNavigatorProfileId(navigatorExternalId);

            if (!profileId) {
                setError("Navigator profile not found.");
                setEnabled(false);
                return;
            }

            const settings = await fetchNavigatorSettings(profileId);
            setEnabled(settings?.ai_mode_enabled ?? false);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load AI mode settings.");
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

            const channelName = `navigator_settings:${profileId}`;
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
                    { event: "*", schema: "public", table: "navigator_settings", filter: `navigator_id=eq.${profileId}` },
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
                if (channel.topic.startsWith("realtime:navigator_settings:")) {
                    void supabase.removeChannel(channel);
                }
            }
        };
    }, [navigatorExternalId, load]);

    const toggle = useCallback(
        (nextEnabled: boolean) => {
            startTransition(async () => {
                const result = await setAiModeEnabled(nextEnabled);

                if (result.error) {
                    setError(result.error);
                    return;
                }

                setEnabled(nextEnabled);
                setError(null);
            });
        },
        [],
    );

    return { enabled, isLoading, isPending, error, toggle, refresh: load };
}
