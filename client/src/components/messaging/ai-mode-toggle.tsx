"use client";

import { PauseCircle, Play } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

interface AiModeToggleProps {
    enabled: boolean;
    isPending?: boolean;
    disabled?: boolean;
    onToggle: (enabled: boolean) => void;
}

export function AiModeToggle({ enabled, isPending, disabled, onToggle }: AiModeToggleProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                {enabled && (
                    <span className="relative flex size-2.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-fg-brand-primary opacity-75" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-fg-brand-primary" />
                    </span>
                )}
                <span className={cx("text-sm font-medium", enabled ? "text-brand-secondary" : "text-tertiary")}>
                    {enabled ? "AI Mode active" : "Manual mode"}
                </span>
            </div>

            <Button
                type="button"
                color={enabled ? "secondary" : "primary"}
                size="sm"
                isDisabled={disabled || isPending}
                iconLeading={enabled ? PauseCircle : Play}
                onClick={() => onToggle(!enabled)}
            >
                {enabled ? "Pause AI" : "Start AI"}
            </Button>
        </div>
    );
}
