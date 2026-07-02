"use client";

import { MessageItem, type Message as UiMessage } from "@/components/application/messaging/messaging";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { formatMessageTime, roleLabel } from "@/lib/messaging/format";
import type { ConversationWithParticipant, MessageWithSender } from "@/lib/messaging/types";

interface ConversationThreadProps {
    conversation: ConversationWithParticipant | null;
    messages: MessageWithSender[];
    isLoading?: boolean;
    navigatorName?: string;
}

export function ConversationThread({ conversation, messages, isLoading, navigatorName = "You" }: ConversationThreadProps) {
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
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                {isLoading ? (
                    <p className="text-sm text-tertiary">Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p className="text-sm text-tertiary">No messages in this conversation yet.</p>
                ) : (
                    <ul className="flex flex-col gap-4">
                        {messages.map((message) => (
                            <MessageItem key={message.id} msg={toUiMessage(message, navigatorName ?? "You")} showUserLabel={false} />
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
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                {isLoading ? (
                    <p className="text-sm text-tertiary">Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p className="text-sm text-tertiary">No messages in this conversation yet.</p>
                ) : (
                    <ul className="flex flex-col gap-4">
                        {messages.map((message) => (
                            <MessageItem key={message.id} msg={toUiMessage(message, navigatorName ?? "You")} showUserLabel={false} />
                        ))}
                        <div ref={bottomRef} />
                    </ul>
                )}
            </div>
        </div>
    );
}

function toUiMessage(message: MessageWithSender, navigatorName: string): UiMessage {
    const isNavigator = message.sender_role === "navigator";

    return {
        id: message.id,
        sentAt: formatMessageTime(message.created_at),
        status: message.read_at || isNavigator ? "read" : "sent",
        readAt: message.read_at ? formatMessageTime(message.read_at) : undefined,
        user: {
            me: isNavigator,
            name: isNavigator ? navigatorName : (message.sender?.full_name ?? "Unknown"),
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
