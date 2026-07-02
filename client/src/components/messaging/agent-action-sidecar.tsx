"use client";

import { Badge } from "@/components/base/badges/badges";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { formatMessageTime } from "@/lib/messaging/format";
import type { AgentAction, AgentActionMetadata, AgentToolCallRecord } from "@/lib/messaging/types";

interface AgentActionSidecarProps {
    action: AgentAction | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

function parseMetadata(metadata: AgentAction["metadata"]): AgentActionMetadata {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
        return {};
    }

    const record = metadata as AgentActionMetadata;
    const toolCalls = Array.isArray(record.toolCalls)
        ? record.toolCalls.filter(
              (entry): entry is AgentToolCallRecord =>
                  typeof entry === "object" &&
                  entry !== null &&
                  "tool" in entry &&
                  typeof entry.tool === "string",
          )
        : [];

    return {
        categoryRationale: typeof record.categoryRationale === "string" ? record.categoryRationale : undefined,
        urgencyRationale: typeof record.urgencyRationale === "string" ? record.urgencyRationale : undefined,
        toolCalls,
        error: typeof record.error === "string" ? record.error : undefined,
    };
}

function formatJson(value: unknown): string {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function formatToolName(tool: string): string {
    return tool
        .replace(/[-_]/g, " ")
        .replace(/Tool$/i, "")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
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

    const metadata = parseMetadata(action.metadata);
    const toolCalls = metadata.toolCalls ?? [];

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

                            {metadata.categoryRationale && (
                                <section className="flex flex-col gap-2">
                                    <h3 className="text-sm font-semibold text-secondary">Category rationale</h3>
                                    <p className="text-sm text-tertiary">{metadata.categoryRationale}</p>
                                </section>
                            )}

                            {metadata.urgencyRationale && (
                                <section className="flex flex-col gap-2">
                                    <h3 className="text-sm font-semibold text-secondary">Urgency rationale</h3>
                                    <p className="text-sm text-tertiary">{metadata.urgencyRationale}</p>
                                </section>
                            )}

                            <section className="flex flex-col gap-2">
                                <h3 className="text-sm font-semibold text-secondary">Status</h3>
                                <p className="text-sm capitalize text-tertiary">{action.status}</p>
                                {metadata.error && <p className="text-sm text-error-primary">{metadata.error}</p>}
                                <p className="text-xs text-quaternary">
                                    Started {formatMessageTime(action.created_at)}
                                    {action.completed_at && ` · Completed ${formatMessageTime(action.completed_at)}`}
                                </p>
                            </section>

                            <section className="flex flex-col gap-2">
                                <h3 className="text-sm font-semibold text-secondary">Tool details</h3>
                                {toolCalls.length === 0 ? (
                                    <p className="text-sm text-quaternary">
                                        {action.decision === "AI"
                                            ? "No tool calls were recorded for this response."
                                            : "No tool calls for this action."}
                                    </p>
                                ) : (
                                    <ul className="flex flex-col gap-3">
                                        {toolCalls.map((call, index) => (
                                            <li
                                                key={`${call.tool}-${index}`}
                                                className="rounded-lg border border-secondary bg-secondary_subtle p-3"
                                            >
                                                <p className="text-sm font-medium text-primary">{formatToolName(call.tool)}</p>
                                                <p className="mt-0.5 text-xs text-quaternary">{call.tool}</p>
                                                <details className="mt-2">
                                                    <summary className="cursor-pointer text-xs text-tertiary">Input</summary>
                                                    <pre className="mt-1 overflow-x-auto text-xs text-quaternary">
                                                        {formatJson(call.input)}
                                                    </pre>
                                                </details>
                                                <details className="mt-2" open={call.output != null}>
                                                    <summary className="cursor-pointer text-xs text-tertiary">Output</summary>
                                                    <pre className="mt-1 overflow-x-auto text-xs text-quaternary">
                                                        {formatJson(call.output)}
                                                    </pre>
                                                </details>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </div>
                    </SlideoutMenu.Content>
                </>
            )}
        </SlideoutMenu>
    );
}
