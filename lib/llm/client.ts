/**
 * Server-only LLM client.
 *
 * SECURITY: This module reads secret environment variables. Never import it from
 * a client component. Next.js only inlines NEXT_PUBLIC_* variables into browser
 * bundles, so non-public keys remain server-side, but keep this boundary intact.
 */
import { z } from "zod";
import type { AgentStepMeta } from "@/lib/types";
import { logServerEvent } from "@/lib/log";

export class LlmError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "LlmError";
    this.code = code;
  }
}

interface LlmConfig {
  configured: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
  jsonMode: boolean;
  timeoutMs: number;
  chatTemplateKwargs?: Record<string, unknown>;
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => typeof value === "string" && value.trim().length > 0);
}

function parseChatTemplateKwargs(): Record<string, unknown> | undefined {
  const raw = firstNonEmpty(
    process.env.NEARAI_CHAT_TEMPLATE_KWARGS,
    process.env.LLM_CHAT_TEMPLATE_KWARGS,
  );
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Invalid JSON is ignored; the provider default applies.
  }
  return undefined;
}

export function getLlmConfig(): LlmConfig {
  const nearaiKey = firstNonEmpty(process.env.NEARAI_CLOUD_API_KEY);
  const genericKey = firstNonEmpty(process.env.LLM_API_KEY);
  const openaiKey = firstNonEmpty(process.env.OPENAI_API_KEY);

  let apiKey = "";
  let baseUrl = "";
  let model = "";

  if (nearaiKey) {
    apiKey = nearaiKey;
    baseUrl =
      firstNonEmpty(process.env.NEARAI_CLOUD_BASE_URL) ?? "https://cloud-api.near.ai";
    model = firstNonEmpty(process.env.NEARAI_MODEL) ?? "Qwen/Qwen3.8-27B";
  } else if (genericKey) {
    apiKey = genericKey;
    baseUrl = firstNonEmpty(process.env.LLM_BASE_URL) ?? "";
    model = firstNonEmpty(process.env.LLM_MODEL) ?? "";
  } else if (openaiKey) {
    apiKey = openaiKey;
    baseUrl = firstNonEmpty(process.env.OPENAI_BASE_URL) ?? "https://api.openai.com";
    model = firstNonEmpty(process.env.OPENAI_MODEL) ?? "";
  }

  const parsedTimeout = Number(process.env.LLM_TIMEOUT_MS ?? "25000");
  const timeoutMs = Number.isFinite(parsedTimeout)
    ? Math.min(Math.max(parsedTimeout, 5000), 45000)
    : 25000;

  return {
    configured: apiKey.length > 0 && baseUrl.length > 0 && model.length > 0,
    apiKey,
    baseUrl,
    model,
    jsonMode: process.env.LLM_JSON_MODE !== "false",
    timeoutMs,
    chatTemplateKwargs: parseChatTemplateKwargs(),
  };
}

export function publicLlmConfig() {
  const config = getLlmConfig();
  let providerHost = "not configured";
  try {
    providerHost = new URL(config.baseUrl).host;
  } catch {
    providerHost = "invalid base URL";
  }
  return {
    configured: config.configured,
    providerHost,
    model: config.model,
    timeoutMs: config.timeoutMs,
  };
}

export function chatCompletionsUrl(baseUrl: string): string {
  const base = baseUrl.trim().replace(/\/+$/, "");
  if (/\/v\d+$/i.test(base)) return `${base}/chat/completions`;
  return `${base}/v1/chat/completions`;
}

export function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return candidate;
  return candidate.slice(start, end + 1);
}

function contentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text: unknown }).text ?? "");
        }
        return "";
      })
      .join("");
  }
  return "";
}

function schemaErrorMessage(error: z.ZodError): string {
  return error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ")
    .slice(0, 700);
}

interface ChatResult {
  content: string;
}

async function requestChat(args: {
  config: LlmConfig;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens: number;
}): Promise<ChatResult> {
  const { config } = args;
  const body: Record<string, unknown> = {
    model: config.model,
    messages: [{ role: "system", content: args.system }, ...args.messages],
    temperature: 0.3,
    max_tokens: args.maxTokens,
  };
  if (config.jsonMode) {
    body.response_format = { type: "json_object" };
  }
  if (config.chatTemplateKwargs) {
    body.chat_template_kwargs = config.chatTemplateKwargs;
  }

  let response: Response;
  try {
    response = await fetch(chatCompletionsUrl(config.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new LlmError(
        "LLM_TIMEOUT",
        `The language model did not respond within ${config.timeoutMs}ms.`,
      );
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new LlmError("LLM_TIMEOUT", "The language model request was aborted.");
    }
    throw new LlmError("LLM_NETWORK", "Could not reach the language model provider.");
  }

  if (!response.ok) {
    const errorText = (await response.text().catch(() => "")).slice(0, 400);
    throw new LlmError(
      `LLM_HTTP_${response.status}`,
      `Language model provider returned HTTP ${response.status}${
        errorText ? `: ${errorText}` : ""
      }`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new LlmError("LLM_BAD_RESPONSE", "The language model provider did not return JSON.");
  }

  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new LlmError("LLM_BAD_RESPONSE", "The language model response contained no choices.");
  }
  const first = choices[0] as {
    finish_reason?: string;
    message?: { content?: unknown; reasoning_content?: unknown };
  };
  const content = contentToString(first.message?.content);
  if (!content.trim()) {
    const reasoning =
      typeof first.message?.reasoning_content === "string"
        ? first.message.reasoning_content.trim()
        : "";
    if (reasoning.length > 0) {
      throw new LlmError(
        "LLM_EMPTY_CONTENT",
        `The model returned reasoning but no final content (finish reason: ${
          first.finish_reason ?? "unknown"
        }). Disable thinking via LLM_CHAT_TEMPLATE_KWARGS or increase the token budget.`,
      );
    }
    throw new LlmError("LLM_EMPTY_RESPONSE", "The language model returned an empty response.");
  }
  return { content };
}

export async function generateStructured<T>(args: {
  step: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxTokens: number;
}): Promise<{ data: T; meta: AgentStepMeta }> {
  const config = getLlmConfig();
  if (!config.configured) {
    throw new LlmError(
      "LLM_NOT_CONFIGURED",
      "LLM provider is not fully configured. Set NEARAI_CLOUD_API_KEY with NEARAI_CLOUD_BASE_URL and NEARAI_MODEL, or LLM_API_KEY with LLM_BASE_URL and LLM_MODEL in the server environment.",
    );
  }

  const started = Date.now();
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    { role: "user", content: args.user },
  ];
  let lastError = "";

  for (let attempt = 1 as 1 | 2; attempt <= 2; attempt = (attempt + 1) as 1 | 2) {
    try {
      const result = await requestChat({
        config,
        system: args.system,
        messages,
        maxTokens: args.maxTokens,
      });

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(extractJson(result.content));
      } catch {
        lastError = "root: response was not valid JSON";
        if (attempt === 1) {
          messages.push({ role: "assistant", content: result.content });
          messages.push({
            role: "user",
            content: `The previous response failed schema validation: ${lastError}. Return only JSON matching the requested schema.`,
          });
          continue;
        }
        throw new LlmError("LLM_INVALID_JSON", "The language model did not return valid JSON.");
      }

      const validated = args.schema.safeParse(parsedJson);
      if (!validated.success) {
        lastError = schemaErrorMessage(validated.error);
        if (attempt === 1) {
          messages.push({ role: "assistant", content: result.content });
          messages.push({
            role: "user",
            content: `The previous response failed schema validation: ${lastError}. Return only JSON matching the requested schema.`,
          });
          continue;
        }
        throw new LlmError(
          "LLM_SCHEMA_VALIDATION",
          `The language model response failed validation twice: ${lastError}`,
        );
      }

      const durationMs = Date.now() - started;
      logServerEvent({
        event: "agent_step",
        step: args.step,
        attempt,
        durationMs,
        ok: true,
      });
      return {
        data: validated.data,
        meta: { step: args.step, model: config.model, durationMs, attempt },
      };
    } catch (error) {
      if (attempt === 2 || !(error instanceof LlmError) || !error.code.startsWith("LLM_SCHEMA")) {
        const durationMs = Date.now() - started;
        const code = error instanceof LlmError ? error.code : "LLM_UNKNOWN";
        logServerEvent({
          event: "agent_step",
          step: args.step,
          attempt,
          durationMs,
          ok: false,
          code,
        });
        throw error;
      }
    }
  }

  throw new LlmError("LLM_UNKNOWN", "The language model step failed.");
}
