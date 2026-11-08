import { runFactCheckStep } from "@/lib/agents/run";
import { apiRoute, jsonResponse, parseBody, readJsonBody } from "@/lib/api/http";
import { factCheckRequestSchema } from "@/lib/api/schemas";

export const maxDuration = 55;

export const POST = apiRoute("fact-check", async (request) => {
  const body = parseBody(factCheckRequestSchema, await readJsonBody(request));
  const { factCheck, meta } = await runFactCheckStep({
    draft: body.draft,
    beat: body.beat,
  });
  return jsonResponse({ factCheck, meta });
});
