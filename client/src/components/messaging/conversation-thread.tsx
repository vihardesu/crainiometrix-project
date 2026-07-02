"use client";

import { MessageItem, type Message as UiMessage } from "@/components/application/messaging/messaging";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { Badge } from "@/components/base/badges/badges";
import { formatMessageTime, roleLabel } from "@/lib/messaging/format";
import type { AgentAction, ConversationWithParticipant, MessageWithSender } from "@/lib/messaging/types";
import { cx } from "@/utils/cx";

interface ConversationThreadProps {
    conversation: ConversationWithParticipant | null;
    messages: MessageWithSender[];
    isLoading?: boolean;
    navigatorName?: string;
    agentActionsByTriggerMessageId?: Map<string, AgentAction>;
    onViewAgentAction?: (action: AgentAction) => void;
}

export function ConversationThread({
    conversation,
    messages,
    isLoading,
    navigatorName = "You",
    agentActionsByTriggerMessageId,
    onViewAgentAction,
}: ConversationThreadProps) {
    if (!conversation) {
        return (
            <div className="flex flex-1 items-center justify-center bg-primary">
                <p className="text-sm text-tertiary">Select a conversation to view messages.</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-primary">
            <header className="flex items-center gap-3 border-b border-secondary px-4 py-3">
                <AvatarLabelGroup
                    size="md"
                    title={conversation.participant.full_name}
                    subtitle={roleLabel(conversation.participant.role)}
                    initials={getInitials(conversation.participant.full_name)}
                />
                {conversation.is_escalated && (
                    <Badge type="pill-color" color="error" size="sm">
                        Escalated
                    </Badge>
                )}
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                {isLoading ? (
                    <p className="text-sm text-tertiary">Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p className="text-sm text-tertiary">No messages in this conversation yet.</p>
                ) : (
                    <ul className="flex flex-col gap-4">
                        {messages.map((message) => (
                            <MessageThreadItem
                                key={message.id}
                                message={message}
                                navigatorName={navigatorName}
                                agentAction={agentActionsByTriggerMessageId?.get(message.id)}
                                onViewAgentAction={onViewAgentAction}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export function ConversationThreadPane({
    conversation,
    messages,
    isLoading,
    navigatorName,
    bottomRef,
    agentActionsByTriggerMessageId,
    onViewAgentAction,
}: ConversationThreadProps & { bottomRef?: React.RefObject<HTMLDivElement | null> }) {
    if (!conversation) {
        return (
            <div className="flex flex-1 items-center justify-center bg-primary">
                <p className="text-sm text-tertiary">Select a conversation to view messages.</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-primary">
            <header className="flex items-center gap-3 border-b border-secondary px-4 py-3">
                <AvatarLabelGroup
                    size="md"
                    title={conversation.participant.full_name}
                    subtitle={roleLabel(conversation.participant.role)}
                    initials={getInitials(conversation.participant.full_name)}
                />
                {conversation.is_escalated && (
                    <Badge type="pill-color" color="error" size="sm">
                        Escalated
                    </Badge>
                )}
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                {isLoading ? (
                    <p className="text-sm text-tertiary">Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p className="text-sm text-tertiary">No messages in this conversation yet.</p>
                ) : (
                    <ul className="flex flex-col gap-4">
                        {messages.map((message) => (
                            <MessageThreadItem
                                key={message.id}
                                message={message}
                                navigatorName={navigatorName ?? "You"}
                                agentAction={agentActionsByTriggerMessageId?.get(message.id)}
                                onViewAgentAction={onViewAgentAction}
                            />
                        ))}
                        <div ref={bottomRef} />
                    </ul>
                )}
            </div>
        </div>
    );
}

interface MessageThreadItemProps {
    message: MessageWithSender;
    navigatorName: string;
    agentAction?: AgentAction;
    onViewAgentAction?: (action: AgentAction) => void;
}

function MessageThreadItem({ message, navigatorName, agentAction, onViewAgentAction }: MessageThreadItemProps) {
    const uiMessage = toUiMessage(message, navigatorName);

    const footer =
        agentAction && onViewAgentAction ? (
            <button
                type="button"
                onClick={() => onViewAgentAction(agentAction)}
                className={cx(
                    "rounded-md px-2 py-1 text-xs font-medium text-brand-secondary",
                    "hover:bg-secondary_subtle hover:text-brand-secondary_hover",
                    message.sender_role !== "navigator" ? "self-start" : "self-end",
                )}
            >
                View agent summary
            </button>
        ) : undefined;

    return <MessageItem msg={uiMessage} showUserLabel={false} footer={footer} />;
}

function toUiMessage(message: MessageWithSender, navigatorName: string): UiMessage {
    const isNavigator = message.sender_role === "navigator";
    const isAiGenerated = message.is_ai_generated;

    return {
        id: message.id,
        sentAt: formatMessageTime(message.created_at),
        status: message.read_at || isNavigator ? "read" : "sent",
        readAt: message.read_at ? formatMessageTime(message.read_at) : undefined,
        isAiGenerated: isAiGenerated,
        user: {
            me: isNavigator,
            name: isNavigator ? (isAiGenerated ? "AI Agent" : navigatorName) : (message.sender?.full_name ?? "Unknown"),
        },
        text: message.body,
    };
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}
