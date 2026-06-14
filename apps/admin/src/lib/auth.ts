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
