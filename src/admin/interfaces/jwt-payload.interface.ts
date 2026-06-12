export type JwtPurpose = 'access' | 'mfa';

export interface JwtPayload {
  sub: string;
  email: string;
  purpose: JwtPurpose;
}

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  name: string;
}
