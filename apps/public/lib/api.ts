import type { ApiError } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const API_KEY = process.env.NEXT_PUBLIC_APPLICATION_API_KEY;

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

function parseFieldErrors(message: string | string[]): Record<string, string> | undefined {
  if (!Array.isArray(message)) return undefined;
  const errors: Record<string, string> = {};
  for (const item of message) {
    const match = item.match(/^(\w+)\s/);
    if (match) errors[match[1]] = item;
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (API_KEY) {
    headers.set('x-api-key', API_KEY);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? response.statusText);
    throw new ApiRequestError(
      response.status,
      message,
      parseFieldErrors(body.message),
    );
  }

  return response.json() as Promise<T>;
}

export function getLineLoginUrl(email: string): string {
  const base = API_BASE;
  const returnUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/line-link/complete`
      : '';
  const params = new URLSearchParams({
    email,
    userType: 'teacher',
    returnUrl,
  });
  return `${base}/api/v1/auth/line/login?${params.toString()}`;
}
