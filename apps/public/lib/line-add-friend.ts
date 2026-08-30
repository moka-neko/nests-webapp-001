const FALLBACK_ADD_FRIEND_URL =
  process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL ?? '';

export function resolveAddFriendUrl(fromCallback?: string | null): string {
  return fromCallback?.trim() || FALLBACK_ADD_FRIEND_URL;
}

/** LINE callback 後の公開サイト完了 URL */
export function getLineLinkCompleteReturnUrl(origin: string): string {
  return `${origin}/line-link/complete`;
}

export async function fetchAddFriendUrlFromApi(): Promise<string> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
  try {
    const response = await fetch(`${base}/api/v1/auth/line/add-friend`);
    if (!response.ok) {
      return '';
    }
    const body = (await response.json()) as { addFriendUrl?: string };
    return body.addFriendUrl?.trim() ?? '';
  } catch {
    return '';
  }
}
