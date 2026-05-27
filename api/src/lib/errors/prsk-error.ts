export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTEGRATION_ERROR'
  | 'INTERNAL_ERROR';

export class PRSKError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: any;
  public readonly cause?: any;

  constructor({
    message,
    code,
    status,
    details,
    cause,
  }: {
    message: string;
    code: ErrorCode;
    status: number;
    details?: any;
    cause?: any;
  }) {
    super(message);
    this.name = 'PRSKError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.cause = cause;
  }
}
