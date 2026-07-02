import type { AgentCategory } from "../schemas/triage-schemas";

export type CareResourceTopic =
    | "scheduling"
    | "referral"
    | "transportation"
    | "non-clinical"
    | "clinical-guidance";

export interface CareResourceSnippet {
    topic: CareResourceTopic;
    title: string;
    summary: string;
    details: string[];
    relatedCategories: AgentCategory[];
}

const CARE_RESOURCES: CareResourceSnippet[] = [
    {
        topic: "scheduling",
        title: "Medication schedule support",
        summary: "Pill organizers and consistent medication routines can reduce confusion for people with dementia.",
        details: [
            "A weekly pill organizer with AM/PM compartments is often a good first step.",
            "Label compartments with days and times using large print.",
            "Care navigators can help schedule a brief check-in to review the medication list with the family.",
            "We do not adjust prescriptions — coordinate medication changes with the prescribing clinician.",
        ],
        relatedCategories: ["Scheduling"],
    },
    {
        topic: "scheduling",
        title: "Navigator check-in calls",
        summary: "Care navigators can schedule routine check-in calls with patients and caregivers.",
        details: [
            "Typical check-ins are 15–20 minutes by phone or video.",
            "Available windows are usually weekday mornings and early afternoons.",
            "Share preferred days/times and we will confirm scheduling in a follow-up.",
        ],
        relatedCategories: ["Scheduling", "Non-Clinical"],
    },
    {
        topic: "referral",
        title: "Memory care specialist referrals",
        summary: "We maintain a list of memory care and neurology partners in the region.",
        details: [
            "Referrals typically require a primary care visit or existing dementia diagnosis documentation.",
            "Partner clinics: Riverside Memory Center, Northside Neurology Associates, and Harbor Geriatrics.",
            "Average wait for new patient appointments is 4–6 weeks; urgent cases can be flagged for outreach.",
            "Care navigators help gather intake forms and appointment logistics — not clinical assessments.",
        ],
        relatedCategories: ["Referral"],
    },
    {
        topic: "transportation",
        title: "Medical appointment transportation",
        summary: "Several non-emergency medical transport options are available for dementia patients.",
        details: [
            "MedRide Plus offers door-to-door service for medical appointments (24–48 hr booking recommended).",
            "County Senior Shuttle provides subsidized rides for eligible patients on weekdays.",
            "Family drivers should allow extra time for boarding and orientation at pickup.",
            "For same-day or emergency transport needs, contact the care navigator immediately.",
        ],
        relatedCategories: ["Transportation"],
    },
    {
        topic: "non-clinical",
        title: "Caregiver emotional support",
        summary: "Non-clinical support includes caregiver education, respite resources, and care planning conversations.",
        details: [
            "Caregiver support groups meet virtually on Tuesday evenings.",
            "Respite care vouchers may be available through regional aging services.",
            "Navigators can help families plan daily routines and communication strategies.",
        ],
        relatedCategories: ["Non-Clinical"],
    },
    {
        topic: "clinical-guidance",
        title: "Clinical escalation policy",
        summary: "Clinical questions and safety concerns require a human care navigator — AI does not provide medical advice.",
        details: [
            "Escalate immediately for falls with injury, chest pain, suicidal ideation, or sudden confusion changes.",
            "Medication dosage changes must be directed to the prescribing clinician.",
            "Symptom interpretation and diagnosis are outside the scope of automated responses.",
        ],
        relatedCategories: ["Clinical"],
    },
];

export function lookupCareResources(topic: CareResourceTopic, query?: string): CareResourceSnippet[] {
    const normalizedQuery = query?.trim().toLowerCase();

    return CARE_RESOURCES.filter((resource) => {
        if (resource.topic !== topic) {
            return false;
        }

        if (!normalizedQuery) {
            return true;
        }

        const haystack = [resource.title, resource.summary, ...resource.details].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
    });
}

export function lookupCareResourcesByCategory(category: AgentCategory): CareResourceSnippet[] {
    return CARE_RESOURCES.filter((resource) => resource.relatedCategories.includes(category));
}
