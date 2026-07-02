"use client";

import { cx } from "@/utils/cx";

interface AiModeOverlayProps {
    active: boolean;
    statusText?: string;
}

export function AiModeOverlay({ active, statusText = "AI is triaging messages…" }: AiModeOverlayProps) {
    if (!active) {
        return null;
    }

    return (
        <div
            className={cx(
                "pointer-events-auto absolute inset-0 z-10 flex items-center justify-center",
                "bg-primary/60 backdrop-blur-sm",
            )}
            aria-live="polite"
            aria-label="AI mode active"
        >
            <div className="flex flex-col items-center gap-3 rounded-xl border border-secondary bg-primary px-6 py-4 shadow-lg">
                <span className="relative flex size-3">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-fg-brand-primary opacity-75" />
                    <span className="relative inline-flex size-3 rounded-full bg-fg-brand-primary" />
                </span>
                <p className="text-sm font-medium text-primary">{statusText}</p>
            </div>
        </div>
    );
}
