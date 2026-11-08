import { runPitchStep } from "@/lib/agents/run";
import { apiRoute, jsonResponse, parseBody, readJsonBody } from "@/lib/api/http";
import { pitchRequestSchema } from "@/lib/api/schemas";

export const maxDuration = 55;

export const POST = apiRoute("pitch", async (request) => {
  const body = parseBody(pitchRequestSchema, await readJsonBody(request));
  const { pitch, meta } = await runPitchStep(body.agentId);
  return jsonResponse({ pitch, meta });
});
