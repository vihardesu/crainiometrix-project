"use client";

import { Badge } from "@/components/base/badges/badges";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { formatMessageTime } from "@/lib/messaging/format";
import type { AgentAction } from "@/lib/messaging/types";

interface AgentActionSidecarProps {
    action: AgentAction | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

function decisionColor(decision: string | null): "brand" | "gray" | "error" | "warning" {
    switch (decision) {
        case "AI":
            return "brand";
        case "Escalate":
            return "error";
        case "Human":
            return "warning";
        default:
            return "gray";
    }
}

export function AgentActionSidecar({ action, isOpen, onOpenChange }: AgentActionSidecarProps) {
    if (!action) {
        return null;
    }

    return (
        <SlideoutMenu isOpen={isOpen} onOpenChange={onOpenChange}>
            {({ close }) => (
                <>
                    <SlideoutMenu.Header onClose={close}>
                        <h2 className="text-lg font-semibold text-primary">Agent summary</h2>
                        <p className="mt-1 text-sm text-tertiary">Classification and decision for this message</p>
                    </SlideoutMenu.Header>

                    <SlideoutMenu.Content>
                        <div className="flex flex-col gap-6">
                            <section className="flex flex-col gap-3">
                                <h3 className="text-sm font-semibold text-secondary">Decision</h3>
                                <div className="flex flex-wrap gap-2">
                                    {action.decision && (
                                        <Badge type="pill-color" color={decisionColor(action.decision)} size="md">
                                            {action.decision}
                                        </Badge>
                                    )}
                                    {action.category && (
                                        <Badge type="pill-color" color="gray" size="md">
                                            {action.category}
                                        </Badge>
                                    )}
                                    {action.urgency && (
                                        <Badge
                                            type="pill-color"
                                            color={action.urgency === "Urgent" ? "error" : "gray"}
                                            size="md"
                                        >
                                            {action.urgency}
                                        </Badge>
                                    )}
                                </div>
                            </section>

                            {action.summary && (
                                <section className="flex flex-col gap-2">
                                    <h3 className="text-sm font-semibold text-secondary">Summary</h3>
                                    <p className="text-sm text-tertiary">{action.summary}</p>
                                </section>
                            )}

                            <section className="flex flex-col gap-2">
                                <h3 className="text-sm font-semibold text-secondary">Status</h3>
                                <p className="text-sm capitalize text-tertiary">{action.status}</p>
                                <p className="text-xs text-quaternary">
                                    Started {formatMessageTime(action.created_at)}
                                    {action.completed_at && ` · Completed ${formatMessageTime(action.completed_at)}`}
                                </p>
                            </section>

                            <section className="flex flex-col gap-2">
                                <h3 className="text-sm font-semibold text-secondary">Tool details</h3>
                                <p className="text-sm text-quaternary">Sub-agent tool calls will appear here once the Mastra workflow is connected.</p>
                            </section>
                        </div>
                    </SlideoutMenu.Content>
                </>
            )}
        </SlideoutMenu>
    );
}
