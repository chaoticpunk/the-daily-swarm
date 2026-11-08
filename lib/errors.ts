export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  readonly detail?: string;

  constructor(args: {
    code: string;
    message: string;
    status?: number;
    retryable?: boolean;
    detail?: string;
  }) {
    super(args.message);
    this.name = "AppError";
    this.code = args.code;
    this.status = args.status ?? 400;
    this.retryable = args.retryable ?? false;
    this.detail = args.detail;
  }
}

export function asAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError({
      code: "INTERNAL_ERROR",
      message: error.message,
      status: 500,
    });
  }
  return new AppError({
    code: "INTERNAL_ERROR",
    message: "An unknown error occurred.",
    status: 500,
  });
}
