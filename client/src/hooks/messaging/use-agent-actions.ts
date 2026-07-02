"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { fetchAgentActionsForConversation } from "@/lib/messaging/queries";
import type { AgentAction } from "@/lib/messaging/types";

export function useAgentActions(conversationId: string | null) {
    const [actions, setActions] = useState<AgentAction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!conversationId) {
            setActions([]);
            return;
        }

        setIsLoading(true);

        try {
            const data = await fetchAgentActionsForConversation(conversationId);
            setActions(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load agent actions.");
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (!conversationId) {
            return;
        }

        let cancelled = false;
        const supabase = createClient();
        const channelName = `agent_actions:${conversationId}`;

        const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);

        if (existing) {
            void supabase.removeChannel(existing);
        }

        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "agent_actions", filter: `conversation_id=eq.${conversationId}` },
                () => {
                    if (!cancelled) {
                        void load();
                    }
                },
            )
            .subscribe();

        return () => {
            cancelled = true;
            void supabase.removeChannel(channel);
        };
    }, [conversationId, load]);

    const actionsByTriggerMessageId = useMemo(() => {
        const map = new Map<string, AgentAction>();

        for (const action of actions) {
            map.set(action.trigger_message_id, action);
        }

        return map;
    }, [actions]);

    return { actions, actionsByTriggerMessageId, isLoading, error, refresh: load };
}
