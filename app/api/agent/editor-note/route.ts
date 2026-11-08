import { runEditorNoteStep } from "@/lib/agents/run";
import { apiRoute, jsonResponse, parseBody, readJsonBody } from "@/lib/api/http";
import { editorNoteRequestSchema } from "@/lib/api/schemas";

export const maxDuration = 55;

export const POST = apiRoute("editor-note", async (request) => {
  const body = parseBody(editorNoteRequestSchema, await readJsonBody(request));
  const { result, meta } = await runEditorNoteStep(body.stories);
  return jsonResponse({ ...result, meta });
});
