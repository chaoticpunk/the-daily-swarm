import { runSelectionStep } from "@/lib/agents/run";
import { apiRoute, jsonResponse, parseBody, readJsonBody } from "@/lib/api/http";
import { selectRequestSchema } from "@/lib/api/schemas";

export const maxDuration = 55;

export const POST = apiRoute("selection", async (request) => {
  const body = parseBody(selectRequestSchema, await readJsonBody(request));
  const { result, meta } = await runSelectionStep(body.pitches);
  return jsonResponse({ ...result, meta });
});
