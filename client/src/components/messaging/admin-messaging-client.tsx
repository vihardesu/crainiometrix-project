"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ConversationThreadPane } from "@/components/messaging/conversation-thread";
import { MessageCompose } from "@/components/messaging/message-compose";
import { Select } from "@/components/base/select/select";
import { SelectItem } from "@/components/base/select/select-item";
import type { SelectItemType } from "@/components/base/select/select-shared";
import { useMessages } from "@/hooks/messaging/use-messages";
import { useParticipants } from "@/hooks/messaging/use-participants";
import { getOrCreateConversation, sendParticipantMessage } from "@/lib/messaging/actions";
import { fetchConversations, fetchNavigatorProfileId } from "@/lib/messaging/queries";
import type { ConversationWithParticipant } from "@/lib/messaging/types";
import { roleLabel } from "@/lib/messaging/format";

interface AdminMessagingClientProps {
    navigatorId: string;
}

export function AdminMessagingClient({ navigatorId }: AdminMessagingClientProps) {
    const { participants, isLoading: participantsLoading } = useParticipants();
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [conversation, setConversation] = useState<ConversationWithParticipant | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const { messages, isLoading: messagesLoading, bottomRef } = useMessages(conversationId);

    const participantItems: SelectItemType[] = participants.map((participant) => ({
        id: participant.id,
        label: `${participant.full_name} (${roleLabel(participant.role)})`,
    }));

    const loadConversation = useCallback(
        async (participantId: string) => {
            setError(null);

            const result = await getOrCreateConversation(participantId);

            if (result.error || !result.conversationId) {
                setError(result.error ?? "Failed to load conversation.");
                setConversation(null);
                setConversationId(null);
                return;
            }

            const navigatorProfileId = await fetchNavigatorProfileId(navigatorId);

            if (!navigatorProfileId) {
                setError("Navigator profile not found.");
                return;
            }

            const conversations = await fetchConversations(navigatorProfileId);
            const match = conversations.find((item) => item.id === result.conversationId) ?? null;

            if (match) {
                setConversation(match);
            } else {
                const participant = participants.find((item) => item.id === participantId);

                if (participant) {
                    setConversation({
                        id: result.conversationId,
                        navigator_id: navigatorProfileId,
                        participant_id: participantId,
                        participant,
                        last_message_at: null,
                        last_message_body: null,
                        unread_count: 0,
                        is_escalated: false,
                        created_at: new Date().toISOString(),
                    });
                }
            }

            setConversationId(result.conversationId);
        },
        [navigatorId, participants],
    );

    useEffect(() => {
        if (!selectedParticipantId) {
            setConversation(null);
            setConversationId(null);
            return;
        }

        startTransition(() => {
            void loadConversation(selectedParticipantId);
        });
    }, [selectedParticipantId, loadConversation]);

    const handleSend = useCallback(
        async (body: string) => {
            if (!conversationId || !selectedParticipantId) {
                return { error: "Select a user first." };
            }

            return sendParticipantMessage(conversationId, selectedParticipantId, body);
        },
        [conversationId, selectedParticipantId],
    );

    return (
        <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-xl border border-secondary bg-primary md:h-[calc(100dvh-4rem)]">
            <div className="border-b border-secondary px-4 py-4">
                <h1 className="text-lg font-semibold text-primary">Admin</h1>
                <p className="mb-4 text-sm text-tertiary">Send messages on behalf of patients and caregivers.</p>

                <Select
                    label="Message as"
                    placeholder={participantsLoading ? "Loading users..." : "Select a patient or caregiver"}
                    selectedKey={selectedParticipantId}
                    onSelectionChange={(key) => setSelectedParticipantId(key ? String(key) : null)}
                    items={participantItems}
                    isDisabled={participantsLoading || isPending}
                >
                    {(item) => <SelectItem id={item.id} label={item.label} />}
                </Select>

                {error && <p className="mt-2 text-sm text-error-primary">{error}</p>}
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                {selectedParticipantId ? (
                    <>
                        <ConversationThreadPane
                            conversation={conversation}
                            messages={messages}
                            isLoading={messagesLoading || isPending}
                            navigatorName="Navigator"
                            bottomRef={bottomRef}
                        />
                        <MessageCompose
                            placeholder={`Message as ${conversation?.participant.full_name ?? "selected user"}...`}
                            onSend={handleSend}
                            disabled={!conversationId || isPending}
                        />
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <p className="text-sm text-tertiary">Select a user to view or start their conversation with the navigator.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
