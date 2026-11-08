import { runReviseStep } from "@/lib/agents/run";
import { apiRoute, jsonResponse, parseBody, readJsonBody } from "@/lib/api/http";
import { reviseRequestSchema } from "@/lib/api/schemas";

export const maxDuration = 55;

export const POST = apiRoute("revise", async (request) => {
  const body = parseBody(reviseRequestSchema, await readJsonBody(request));
  const { draft, meta } = await runReviseStep({
    draft: body.draft,
    factCheck: body.factCheck,
    beat: body.beat,
  });
  return jsonResponse({ draft, meta });
});
