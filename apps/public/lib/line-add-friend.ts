const FALLBACK_ADD_FRIEND_URL =
  process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL ?? '';

export function resolveAddFriendUrl(fromCallback?: string | null): string {
  return fromCallback?.trim() || FALLBACK_ADD_FRIEND_URL;
}

/** LINE callback 後の公開サイト完了 URL */
export function getLineLinkCompleteReturnUrl(origin: string): string {
  return `${origin}/line-link/complete`;
}
