import { createTool } from "@mastra/core/tools";
import { participantContextSchema } from "../schemas/triage-schemas";

export const fetchParticipantContextTool = createTool({
    id: "fetch-participant-context",
    description: "Returns profile context for the patient or caregiver in this conversation.",
    inputSchema: participantContextSchema,
    outputSchema: participantContextSchema,
    execute: async (inputData) => inputData,
});
