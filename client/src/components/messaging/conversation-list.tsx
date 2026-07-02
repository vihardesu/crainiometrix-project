"use client";

import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { formatListTime, roleLabel } from "@/lib/messaging/format";
import type { ConversationWithParticipant } from "@/lib/messaging/types";
import { cx } from "@/utils/cx";

interface ConversationListProps {
    conversations: ConversationWithParticipant[];
    selectedId: string | null;
    onSelect: (conversationId: string) => void;
    isLoading?: boolean;
    processingConversationId?: string | null;
}

export function ConversationList({ conversations, selectedId, onSelect, isLoading, processingConversationId }: ConversationListProps) {
    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center p-6">
                <p className="text-sm text-tertiary">Loading conversations...</p>
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center p-6">
                <p className="text-center text-sm text-tertiary">No conversations yet.</p>
            </div>
        );
    }

    return (
        <ul className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => {
                const isSelected = conversation.id === selectedId;
                const hasUnread = conversation.unread_count > 0;
                const isProcessing = conversation.id === processingConversationId;

                return (
                    <li key={conversation.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(conversation.id)}
                            className={cx(
                                "flex w-full items-start gap-3 border-b border-secondary px-4 py-3 text-left transition duration-100",
                                isSelected ? "bg-secondary_subtle" : "hover:bg-primary_hover",
                                conversation.is_escalated && "border-l-2 border-l-utility-red-500",
                                isProcessing && "bg-brand-primary_alt/30",
                            )}
                        >
                            <Avatar size="md" alt={conversation.participant.full_name} initials={getInitials(conversation.participant.full_name)} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={cx("truncate text-sm font-semibold", hasUnread ? "text-primary" : "text-secondary")}>
                                        {conversation.participant.full_name}
                                    </span>
                                    <Badge type="pill-color" color="gray" size="sm">
                                        {roleLabel(conversation.participant.role)}
                                    </Badge>
                                    {hasUnread && <span className="ml-auto size-2 shrink-0 rounded-full bg-fg-brand-primary" />}
                                </div>
                                <p className={cx("mt-0.5 truncate text-sm", hasUnread ? "font-medium text-primary" : "text-tertiary")}>
                                    {conversation.last_message_body ?? "No messages yet"}
                                </p>
                            </div>
                            <span className="shrink-0 text-xs text-quaternary">{formatListTime(conversation.last_message_at)}</span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}
