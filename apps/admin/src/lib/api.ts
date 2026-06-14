import { clearAccessToken, getAccessToken } from './auth';
import type { ApiError } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiRequestError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function parseFieldErrors(message: string | string[]): Record<string, string> | undefined {
  if (!Array.isArray(message)) return undefined;
  const errors: Record<string, string> = {};
  for (const item of message) {
    const match = item.match(/^(\w+)\s/);
    if (match) {
      errors[match[1]] = item;
    }
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    clearAccessToken();
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new ApiRequestError(401, '認証が必要です');
  }

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

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  return handleResponse<T>(response);
}
