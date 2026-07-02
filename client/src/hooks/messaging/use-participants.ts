"use client";

import { useEffect, useState } from "react";
import { fetchParticipants } from "@/lib/messaging/queries";
import type { Profile } from "@/lib/messaging/types";

export function useParticipants() {
    const [participants, setParticipants] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const data = await fetchParticipants();
                setParticipants(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load participants.");
            } finally {
                setIsLoading(false);
            }
        }

        void load();
    }, []);

    return { participants, isLoading, error };
}
