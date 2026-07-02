"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AiModeOverlay } from "@/components/messaging/ai-mode-overlay";
import { AiModeToggle } from "@/components/messaging/ai-mode-toggle";
import { AgentActionSidecar } from "@/components/messaging/agent-action-sidecar";
import { ConversationList } from "@/components/messaging/conversation-list";
import { ConversationThreadPane } from "@/components/messaging/conversation-thread";
import { MessageCompose } from "@/components/messaging/message-compose";
import { useAgentActions } from "@/hooks/messaging/use-agent-actions";
import { useAgentProcessor } from "@/hooks/messaging/use-agent-processor";
import { useAiMode } from "@/hooks/messaging/use-ai-mode";
import { useConversations } from "@/hooks/messaging/use-conversations";
import { useMessages } from "@/hooks/messaging/use-messages";
import { markConversationRead, sendNavigatorMessage } from "@/lib/messaging/actions";
import type { AgentAction } from "@/lib/messaging/types";

interface MessagesCommandCenterProps {
    navigatorId: string;
    navigatorName: string;
}

export function MessagesCommandCenter({ navigatorId, navigatorName }: MessagesCommandCenterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedId = searchParams.get("conversation");

    const { enabled: aiModeEnabled, isPending: aiModePending, toggle: toggleAiMode } = useAiMode(navigatorId);
    const { conversations, isLoading: conversationsLoading, error: conversationsError } = useConversations(navigatorId);
    const { messages, isLoading: messagesLoading, bottomRef } = useMessages(selectedId);
    const { actionsByTriggerMessageId } = useAgentActions(selectedId);
    const { processingConversationId } = useAgentProcessor(aiModeEnabled);

    const [selectedAgentAction, setSelectedAgentAction] = useState<AgentAction | null>(null);
    const [sidecarOpen, setSidecarOpen] = useState(false);

    const selectedConversation = useMemo(
        () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
        [conversations, selectedId],
    );

    const processingConversation = useMemo(
        () => conversations.find((conversation) => conversation.id === processingConversationId) ?? null,
        [conversations, processingConversationId],
    );

    const overlayStatusText = processingConversation
        ? `AI is triaging messages… reviewing ${processingConversation.participant.full_name}`
        : "AI is triaging messages…";

    const handleSelect = useCallback(
        (conversationId: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("conversation", conversationId);
            router.replace(`/messages?${params.toString()}`);
        },
        [router, searchParams],
    );

    useEffect(() => {
        if (selectedId && !aiModeEnabled) {
            void markConversationRead(selectedId);
        }
    }, [selectedId, aiModeEnabled]);

    const handleSend = useCallback(
        async (body: string) => {
            if (!selectedId) {
                return { error: "Select a conversation first." };
            }

            if (aiModeEnabled) {
                return { error: "AI mode is active. Turn off AI mode to send messages manually." };
            }

            return sendNavigatorMessage(selectedId, body);
        },
        [selectedId, aiModeEnabled],
    );

    const handleViewAgentAction = useCallback((action: AgentAction) => {
        setSelectedAgentAction(action);
        setSidecarOpen(true);
    }, []);

    const threadProps = {
        conversation: selectedConversation,
        messages,
        isLoading: messagesLoading,
        navigatorName,
        bottomRef,
        agentActionsByTriggerMessageId: actionsByTriggerMessageId,
        onViewAgentAction: handleViewAgentAction,
    };

    return (
        <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-xl border border-secondary bg-primary md:h-[calc(100dvh-4rem)]">
            <div className="flex items-center justify-between gap-4 border-b border-secondary px-4 py-3">
                <div>
                    <h1 className="text-lg font-semibold text-primary">Messages</h1>
                    <p className="text-sm text-tertiary">Conversation command center</p>
                </div>
                <AiModeToggle enabled={aiModeEnabled} isPending={aiModePending} onToggle={toggleAiMode} />
            </div>

            {conversationsError && <p className="px-4 py-2 text-sm text-error-primary">{conversationsError}</p>}

            <div className="flex min-h-0 flex-1">
                <aside className="flex w-full max-w-sm flex-col border-r border-secondary">
                    <ConversationList
                        conversations={conversations}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                        isLoading={conversationsLoading}
                        processingConversationId={processingConversationId}
                    />
                </aside>

                <section className="relative hidden min-w-0 flex-1 flex-col md:flex">
                    <div className={aiModeEnabled ? "pointer-events-none flex min-h-0 flex-1 flex-col" : "flex min-h-0 flex-1 flex-col"}>
                        <ConversationThreadPane {...threadProps} />
                        <MessageCompose onSend={handleSend} disabled={!selectedId || aiModeEnabled} />
                    </div>
                    <AiModeOverlay active={aiModeEnabled} statusText={overlayStatusText} />
                </section>
            </div>

            {selectedId && (
                <section className="relative flex min-h-0 flex-1 flex-col border-t border-secondary md:hidden">
                    <div className={aiModeEnabled ? "pointer-events-none flex min-h-0 flex-1 flex-col" : "flex min-h-0 flex-1 flex-col"}>
                        <ConversationThreadPane {...threadProps} />
                        <MessageCompose onSend={handleSend} disabled={aiModeEnabled} />
                    </div>
                    <AiModeOverlay active={aiModeEnabled} statusText={overlayStatusText} />
                </section>
            )}

            <AgentActionSidecar action={selectedAgentAction} isOpen={sidecarOpen} onOpenChange={setSidecarOpen} />
        </div>
    );
}
