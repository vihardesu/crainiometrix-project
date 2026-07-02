"use client";

import { useState, useTransition } from "react";
import { Send01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { TextArea } from "@/components/base/textarea/textarea";

interface MessageComposeProps {
    placeholder?: string;
    onSend: (body: string) => Promise<{ error?: string; success?: boolean }>;
    disabled?: boolean;
}

export function MessageCompose({ placeholder = "Type a message...", onSend, disabled }: MessageComposeProps) {
    const [body, setBody] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        const trimmed = body.trim();

        if (!trimmed || disabled || isPending) {
            return;
        }

        startTransition(async () => {
            const result = await onSend(trimmed);

            if (result.error) {
                setError(result.error);
                return;
            }

            setBody("");
            setError(null);
        });
    }

    return (
        <form onSubmit={handleSubmit} className="border-t border-secondary bg-primary p-4">
            <div className="flex items-end gap-3">
                <TextArea
                    aria-label="Message"
                    placeholder={placeholder}
                    value={body}
                    onChange={setBody}
                    isDisabled={disabled || isPending}
                    rows={2}
                    className="flex-1"
                />
                <Button type="submit" color="primary" size="md" isDisabled={disabled || isPending || !body.trim()} iconLeading={Send01}>
                    Send
                </Button>
            </div>
            {error && <p className="mt-2 text-sm text-error-primary">{error}</p>}
        </form>
    );
}
