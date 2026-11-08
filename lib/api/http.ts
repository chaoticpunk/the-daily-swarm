import { connection } from "next/server";
import { AppError, asAppError } from "@/lib/errors";
import { logServerEvent } from "@/lib/log";
import type { ApiErrorBody } from "@/lib/types";
import type { z } from "zod";

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const;

export function jsonResponse<T>(data: T, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE_HEADERS });
}

export function jsonErrorBody(error: ApiErrorBody["error"], status: number): Response {
  return jsonResponse({ error }, status);
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 200_000) {
    throw new AppError({
      code: "PAYLOAD_TOO_LARGE",
      message: "Request body is too large.",
      status: 413,
    });
  }
  try {
    return await request.json();
  } catch {
    throw new AppError({
      code: "INVALID_JSON",
      message: "Request body must be valid JSON.",
      status: 400,
    });
  }
}

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const detail = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
      .join("; ");
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: `Request failed validation: ${detail}`,
      status: 400,
      detail,
    });
  }
  return result.data;
}

export function assertSameOrigin(request: Request): void {  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("host");
  if (!host) return;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AppError({
      code: "BAD_ORIGIN",
      message: "Cross-origin request rejected.",
      status: 403,
    });
  }
  if (originHost !== host) {
    throw new AppError({
      code: "BAD_ORIGIN",
      message: "Cross-origin request rejected.",
      status: 403,
    });
  }
}

function mapError(error: unknown, step: string): { body: ApiErrorBody; status: number } {
  if (error instanceof AppError) {
    return {
      body: {
        error: {
          code: error.code,
          message: error.message,
          step,
          detail: error.detail,
          retryable: error.retryable,
        },
      },
      status: error.status,
    };
  }

  const maybe = error as { code?: unknown; message?: unknown };
  const code = typeof maybe?.code === "string" ? maybe.code : "INTERNAL_ERROR";
  const message =
    typeof maybe?.message === "string" && maybe.message.length > 0
      ? maybe.message
      : "An unexpected error occurred.";

  if (code === "LLM_NOT_CONFIGURED") {
    return {
      body: { error: { code, message, step, retryable: false } },
      status: 503,
    };
  }
  if (code === "LLM_TIMEOUT") {
    return {
      body: { error: { code, message, step, retryable: true } },
      status: 504,
    };
  }
  if (code === "LLM_HTTP_429") {
    return {
      body: { error: { code, message, step, retryable: true } },
      status: 429,
    };
  }
  if (code.startsWith("LLM_HTTP_5")) {
    return {
      body: { error: { code, message, step, retryable: true } },
      status: 502,
    };
  }
  if (code.startsWith("LLM_") || code.startsWith("NEAR_")) {
    return {
      body: { error: { code, message, step, retryable: false } },
      status: code === "NEAR_RPC_TIMEOUT" ? 504 : 502,
    };
  }

  const appError = asAppError(error);
  return {
    body: {
      error: {
        code: appError.code,
        message: appError.message,
        step,
        detail: appError.detail,
        retryable: appError.retryable,
      },
    },
    status: appError.status,
  };
}

export function apiRoute(
  step: string,
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    // Resolve before the try/catch: during prerender, connection() uses a control-flow
    // signal that must reach Next.js instead of being converted into an API error.
    await connection();
    const started = Date.now();
    try {
      assertSameOrigin(request);
      const response = await handler(request);
      return response;
    } catch (error) {
      const mapped = mapError(error, step);
      logServerEvent({
        event: "api_step",
        step,
        durationMs: Date.now() - started,
        ok: false,
        code: mapped.body.error.code,
      });
      if (mapped.status >= 500) {
        logServerEvent({
          event: "api_error",
          step,
          code: mapped.body.error.code,
        });
      }
      return jsonErrorBody(mapped.body.error, mapped.status);
    }
  };
}

export function methodNotAllowed(): Response {
  return jsonErrorBody(
    {
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed.",
    },
    405,
  );
}
