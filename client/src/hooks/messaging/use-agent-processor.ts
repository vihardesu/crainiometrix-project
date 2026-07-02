"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProcessNextResponse } from "@/lib/messaging/types";

const POLL_INTERVAL_MS = 3000;

export function useAgentProcessor(aiModeEnabled: boolean) {
    const [processingConversationId, setProcessingConversationId] = useState<string | null>(null);
    const [triggerMessageId, setTriggerMessageId] = useState<string | null>(null);
    const [agentActionId, setAgentActionId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const processNext = useCallback(async () => {
        setIsProcessing(true);

        try {
            const response = await fetch("/api/agent/process-next", { method: "POST" });

            if (!response.ok) {
                throw new Error("Failed to process next message.");
            }

            const data = (await response.json()) as ProcessNextResponse;

            if (data.done) {
                setProcessingConversationId(null);
                setTriggerMessageId(null);
                setAgentActionId(null);
                setIsProcessing(false);
            } else {
                setProcessingConversationId(data.processingConversationId ?? null);
                setTriggerMessageId(data.triggerMessageId ?? null);
                setAgentActionId(data.agentActionId ?? null);
                setIsProcessing(data.status === "processing");
            }

            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Agent processor error.");
            setIsProcessing(false);
        }
    }, []);

    useEffect(() => {
        if (!aiModeEnabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            setProcessingConversationId(null);
            setTriggerMessageId(null);
            setAgentActionId(null);
            setIsProcessing(false);
            return;
        }

        void processNext();

        intervalRef.current = setInterval(() => {
            void processNext();
        }, POLL_INTERVAL_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [aiModeEnabled, processNext]);

    return {
        processingConversationId,
        triggerMessageId,
        agentActionId,
        isProcessing,
        error,
        processNext,
    };
}
