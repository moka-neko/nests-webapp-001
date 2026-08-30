const FALLBACK_ADD_FRIEND_URL =
  process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL ?? '';

export function resolveAddFriendUrl(
  fromCallback?: string | null,
): string {
  return fromCallback?.trim() || FALLBACK_ADD_FRIEND_URL;
}

/** CloudFront / S3 が拡張子なしパスを 403 にするため、静的ファイル名を返す */
export function getLineLinkCompleteReturnUrl(origin: string): string {
  return `${origin}/line-link/complete.html`;
}
