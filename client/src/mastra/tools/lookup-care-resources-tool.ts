import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { lookupCareResources } from "../lib/care-knowledge";
import { careResourceTopicSchema } from "../schemas/triage-schemas";

export const lookupCareResourcesTool = createTool({
    id: "lookup-care-resources",
    description:
        "Looks up hardcoded Crainiometrix care navigator resources for scheduling, referrals, transportation, non-clinical support, and clinical escalation guidance.",
    inputSchema: z.object({
        topic: careResourceTopicSchema,
        query: z.string().optional().describe("Optional keyword to narrow results"),
    }),
    outputSchema: z.object({
        resources: z.array(
            z.object({
                topic: careResourceTopicSchema,
                title: z.string(),
                summary: z.string(),
                details: z.array(z.string()),
            }),
        ),
    }),
    execute: async (inputData) => {
        const resources = lookupCareResources(inputData.topic, inputData.query).map(
            ({ topic, title, summary, details }) => ({
                topic,
                title,
                summary,
                details,
            }),
        );

        return { resources };
    },
});
