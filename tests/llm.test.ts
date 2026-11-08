import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  chatCompletionsUrl,
  extractJson,
  getLlmConfig,
} from "@/lib/llm/client";

beforeEach(() => {
  vi.stubEnv("NEARAI_CLOUD_API_KEY", "");
  vi.stubEnv("NEARAI_CLOUD_BASE_URL", "");
  vi.stubEnv("NEARAI_MODEL", "");
  vi.stubEnv("LLM_API_KEY", "");
  vi.stubEnv("LLM_BASE_URL", "");
  vi.stubEnv("LLM_MODEL", "");
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.stubEnv("OPENAI_BASE_URL", "");
  vi.stubEnv("OPENAI_MODEL", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("chatCompletionsUrl", () => {
  it("appends /v1 to a bare base URL", () => {
    expect(chatCompletionsUrl("https://cloud-api.near.ai")).toBe(
      "https://cloud-api.near.ai/v1/chat/completions",
    );
  });

  it("does not double the /v1 prefix", () => {
    expect(chatCompletionsUrl("https://cloud-api.near.ai/v1")).toBe(
      "https://cloud-api.near.ai/v1/chat/completions",
    );
    expect(chatCompletionsUrl("https://cloud-api.near.ai/v1/")).toBe(
      "https://cloud-api.near.ai/v1/chat/completions",
    );
  });
});

describe("extractJson", () => {
  it("strips markdown fences", () => {
    expect(extractJson('```json\n{"ok":true}\n```')).toBe('{"ok":true}');
    expect(extractJson('```\n{"ok":true}\n```')).toBe('{"ok":true}');
  });

  it("extracts the outer JSON object from surrounding prose", () => {
    expect(extractJson('Here is the result:\n{"ok":true}\nDone.')).toBe(
      '{"ok":true}',
    );
  });

  it("returns the trimmed candidate when no object is present", () => {
    expect(extractJson("not json")).toBe("not json");
  });
});

describe("getLlmConfig provider selection", () => {
  it("uses the NEAR AI bundle when a NEARAI key is present", () => {
    vi.stubEnv("NEARAI_CLOUD_API_KEY", "near-key");
    vi.stubEnv("NEARAI_CLOUD_BASE_URL", "https://near.example");
    vi.stubEnv("NEARAI_MODEL", "near-model");
    vi.stubEnv("LLM_API_KEY", "generic-key");
    vi.stubEnv("LLM_BASE_URL", "https://generic.example");
    vi.stubEnv("LLM_MODEL", "generic-model");
    const config = getLlmConfig();
    expect(config.configured).toBe(true);
    expect(config.apiKey).toBe("near-key");
    expect(config.baseUrl).toBe("https://near.example");
    expect(config.model).toBe("near-model");
  });

  it("uses the generic LLM bundle even when NEARAI defaults are present", () => {
    vi.stubEnv("NEARAI_CLOUD_BASE_URL", "https://cloud-api.near.ai");
    vi.stubEnv("NEARAI_MODEL", "Qwen/Qwen3.8-27B");
    vi.stubEnv("LLM_API_KEY", "generic-key");
    vi.stubEnv("LLM_BASE_URL", "https://generic.example");
    vi.stubEnv("LLM_MODEL", "generic-model");
    const config = getLlmConfig();
    expect(config.configured).toBe(true);
    expect(config.apiKey).toBe("generic-key");
    expect(config.baseUrl).toBe("https://generic.example");
    expect(config.model).toBe("generic-model");
  });

  it("is not configured when the generic bundle is missing base URL or model", () => {
    vi.stubEnv("LLM_API_KEY", "generic-key");
    expect(getLlmConfig().configured).toBe(false);
  });
});
