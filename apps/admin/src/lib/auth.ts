const ACCESS_TOKEN_KEY = 'admin_access_token';
const MFA_TOKEN_KEY = 'admin_mfa_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getMfaToken(): string | null {
  return sessionStorage.getItem(MFA_TOKEN_KEY);
}

export function setMfaToken(token: string): void {
  sessionStorage.setItem(MFA_TOKEN_KEY, token);
}

export function clearMfaToken(): void {
  sessionStorage.removeItem(MFA_TOKEN_KEY);
}

export function logout(): void {
  clearAccessToken();
  clearMfaToken();
}

const REDIRECT_KEY = 'admin_redirect_after_login';

/** ログイン後に戻るパス（通知 URL から開いた場合など）を保存する */
export function saveRedirectAfterLogin(path: string): void {
  if (path.startsWith('/') && !path.startsWith('/login')) {
    sessionStorage.setItem(REDIRECT_KEY, path);
  }
}

/** 保存済みの戻り先を取り出して消す（なければ '/'） */
export function consumeRedirectAfterLogin(): string {
  const path = sessionStorage.getItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
  return path && path.startsWith('/') && !path.startsWith('//') ? path : '/';
}
