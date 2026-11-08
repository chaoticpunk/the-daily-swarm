import { runWriteStep } from "@/lib/agents/run";
import { apiRoute, jsonResponse, parseBody, readJsonBody } from "@/lib/api/http";
import { writeRequestSchema } from "@/lib/api/schemas";

export const maxDuration = 55;

export const POST = apiRoute("write", async (request) => {
  const body = parseBody(writeRequestSchema, await readJsonBody(request));
  const { draft, meta } = await runWriteStep({
    assignment: body.assignment,
    pitch: body.pitch,
  });
  return jsonResponse({ draft, meta });
});
