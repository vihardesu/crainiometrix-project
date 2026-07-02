"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConversationList } from "@/components/messaging/conversation-list";
import { ConversationThreadPane } from "@/components/messaging/conversation-thread";
import { MessageCompose } from "@/components/messaging/message-compose";
import { useConversations } from "@/hooks/messaging/use-conversations";
import { useMessages } from "@/hooks/messaging/use-messages";
import { markConversationRead, sendNavigatorMessage } from "@/lib/messaging/actions";

interface MessagesCommandCenterProps {
    navigatorId: string;
    navigatorName: string;
}

export function MessagesCommandCenter({ navigatorId, navigatorName }: MessagesCommandCenterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedId = searchParams.get("conversation");

    const { conversations, isLoading: conversationsLoading, error: conversationsError } = useConversations(navigatorId);
    const { messages, isLoading: messagesLoading, bottomRef } = useMessages(selectedId);

    const selectedConversation = useMemo(
        () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
        [conversations, selectedId],
    );

    const handleSelect = useCallback(
        (conversationId: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("conversation", conversationId);
            router.replace(`/messages?${params.toString()}`);
        },
        [router, searchParams],
    );

    useEffect(() => {
        if (selectedId) {
            void markConversationRead(selectedId);
        }
    }, [selectedId]);

    const handleSend = useCallback(
        async (body: string) => {
            if (!selectedId) {
                return { error: "Select a conversation first." };
            }

            return sendNavigatorMessage(selectedId, body);
        },
        [selectedId],
    );

    return (
        <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-xl border border-secondary bg-primary md:h-[calc(100dvh-4rem)]">
            <div className="border-b border-secondary px-4 py-3">
                <h1 className="text-lg font-semibold text-primary">Messages</h1>
                <p className="text-sm text-tertiary">Conversation command center</p>
            </div>

            {conversationsError && <p className="px-4 py-2 text-sm text-error-primary">{conversationsError}</p>}

            <div className="flex min-h-0 flex-1">
                <aside className="flex w-full max-w-sm flex-col border-r border-secondary">
                    <ConversationList
                        conversations={conversations}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                        isLoading={conversationsLoading}
                    />
                </aside>

                <section className="hidden min-w-0 flex-1 flex-col md:flex">
                    <ConversationThreadPane
                        conversation={selectedConversation}
                        messages={messages}
                        isLoading={messagesLoading}
                        navigatorName={navigatorName}
                        bottomRef={bottomRef}
                    />
                    <MessageCompose onSend={handleSend} disabled={!selectedId} />
                </section>
            </div>

            {selectedId && (
                <div className="flex min-h-0 flex-1 flex-col border-t border-secondary md:hidden">
                    <ConversationThreadPane
                        conversation={selectedConversation}
                        messages={messages}
                        isLoading={messagesLoading}
                        navigatorName={navigatorName}
                        bottomRef={bottomRef}
                    />
                    <MessageCompose onSend={handleSend} />
                </div>
            )}
        </div>
    );
}
