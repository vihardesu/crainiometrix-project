"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { fetchMessages } from "@/lib/messaging/queries";
import type { MessageWithSender } from "@/lib/messaging/types";

export function useMessages(conversationId: string | null) {
    const [messages, setMessages] = useState<MessageWithSender[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    const load = useCallback(async () => {
        if (!conversationId) {
            setMessages([]);
            return;
        }

        setIsLoading(true);

        try {
            const data = await fetchMessages(conversationId);
            setMessages(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load messages.");
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
        const channelName = `messages:${conversationId}`;

        const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
        if (existing) {
            void supabase.removeChannel(existing);
        }

        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                () => {
                    void load();
                },
            )
            .subscribe();

        if (cancelled) {
            void supabase.removeChannel(channel);
        }

        return () => {
            cancelled = true;
            void supabase.removeChannel(channel);
        };
    }, [conversationId, load]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    return { messages, isLoading, error, bottomRef, refresh: load };
}
