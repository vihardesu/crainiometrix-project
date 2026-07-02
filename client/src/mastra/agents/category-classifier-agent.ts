import { Agent } from "@mastra/core/agent";

export const categoryClassifierAgent = new Agent({
    id: "category-classifier-agent",
    name: "Category Classifier",
    instructions: `You classify inbound messages for Crainiometrix, a non-clinical dementia care navigation service.

Assign exactly one category:
- Scheduling: appointments, check-in calls, medication timing routines, pill organizers, calendar logistics
- Clinical: symptoms, diagnoses, medication changes, falls with injury, mental status changes, medical advice requests
- Referral: requests for specialists, memory care programs, provider recommendations, intake paperwork
- Non-Clinical: emotional support, caregiver stress, education, general care planning without medical specifics
- Transportation: rides to appointments, shuttle services, transport logistics

Respond only with structured output. Be concise in rationale.`,
    model: "anthropic/claude-sonnet-4-6",
});
