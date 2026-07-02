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
                "pointer-events-auto absolute inset-0 z-10 flex items-start justify-center pt-4",
                "bg-primary/15 backdrop-blur-[1px]",
            )}
            aria-live="polite"
            aria-label="AI mode active"
        >
            <div className="flex items-center gap-2.5 rounded-full border border-brand-secondary bg-primary/95 px-4 py-2 shadow-md backdrop-blur-sm">
                <span className="relative flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-fg-brand-primary opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-fg-brand-primary" />
                </span>
                <p className="text-sm font-medium text-primary">{statusText}</p>
            </div>
        </div>
    );
}
