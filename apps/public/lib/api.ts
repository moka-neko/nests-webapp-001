import type { ApiError } from './types';
import { getLineLinkCompleteReturnUrl } from './line-add-friend';

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

/**
 * 履歴書用の顔写真をアップロードし、公開 URL を返す。
 * multipart/form-data のため apiFetch は使わない（Content-Type は自動設定させる）。
 */
export async function uploadTeacherPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('photo', file);

  const headers = new Headers();
  if (API_KEY) {
    headers.set('x-api-key', API_KEY);
  }

  const response = await fetch(
    `${API_BASE}/api/v1/teachers/applications/photo`,
    {
      method: 'POST',
      headers,
      body: formData,
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? '顔写真のアップロードに失敗しました');
    throw new ApiRequestError(response.status, message);
  }

  const result = (await response.json()) as { photoUrl: string };
  return result.photoUrl;
}

export function getLineLoginUrl(email: string): string {
  const base = API_BASE;
  const returnUrl =
    typeof window !== 'undefined'
      ? getLineLinkCompleteReturnUrl(window.location.origin)
      : '';
  const params = new URLSearchParams({
    email,
    userType: 'teacher',
    returnUrl,
  });
  return `${base}/api/v1/auth/line/login?${params.toString()}`;
}
