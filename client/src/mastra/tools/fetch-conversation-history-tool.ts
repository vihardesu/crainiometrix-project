import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { recentMessageSchema } from "../schemas/triage-schemas";

export const fetchConversationHistoryTool = createTool({
    id: "fetch-conversation-history",
    description: "Returns recent conversation messages, optionally filtered by a search query.",
    inputSchema: z.object({
        recentMessages: z.array(recentMessageSchema),
        query: z.string().optional().describe("Optional keyword filter for relevant messages"),
    }),
    outputSchema: z.object({
        messages: z.array(recentMessageSchema),
        totalCount: z.number(),
    }),
    execute: async (inputData) => {
        const { recentMessages, query } = inputData;
        const normalizedQuery = query?.trim().toLowerCase();

        const messages = normalizedQuery
            ? recentMessages.filter((message) => message.body.toLowerCase().includes(normalizedQuery))
            : recentMessages;

        return {
            messages,
            totalCount: messages.length,
        };
    },
});
