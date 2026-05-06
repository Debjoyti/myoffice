export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export function formatApiResponse<T>(
  data: T | null,
  error: string | null = null,
  meta?: ApiResponse['meta']
): ApiResponse<T> {
  return {
    data,
    error,
    ...(meta ? { meta } : {}),
  };
}
