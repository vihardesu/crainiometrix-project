import type { ToolCallRecord } from "../schemas/triage-schemas";

type ToolCallChunk = {
    payload: {
        toolCallId: string;
        toolName: string;
        args?: unknown;
    };
};

type ToolResultChunk = {
    payload: {
        toolCallId: string;
        result: unknown;
    };
};

type AgentStep = {
    toolCalls?: ToolCallChunk[];
    toolResults?: ToolResultChunk[];
};

type AgentGenerateOutput = {
    toolCalls?: ToolCallChunk[];
    toolResults?: ToolResultChunk[];
    steps?: AgentStep[];
};

function mapStepToolCalls(step: AgentStep): ToolCallRecord[] {
    const resultsById = new Map(
        (step.toolResults ?? []).map((result) => [result.payload.toolCallId, result.payload.result]),
    );

    return (step.toolCalls ?? []).map((call) => ({
        tool: call.payload.toolName,
        input: call.payload.args ?? null,
        output: resultsById.get(call.payload.toolCallId) ?? null,
    }));
}

export function extractAgentToolCalls(result: AgentGenerateOutput): ToolCallRecord[] {
    const fromSteps = (result.steps ?? []).flatMap(mapStepToolCalls);

    if (fromSteps.length > 0) {
        return fromSteps;
    }

    return mapStepToolCalls({
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
    });
}
