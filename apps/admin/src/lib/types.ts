export type TeacherStatus = 'PENDING' | 'INTERVIEW' | 'HIRED' | 'REJECTED';

export interface TeacherApplication {
  id: string;
  email: string;
  nameKanji: string;
  nameKatakana: string;
  age: number;
  workLocation: string;
  resumeUrl: string;
  questions: string | null;
  status: TeacherStatus;
  lineDisplayName: string | null;
  lineUserId: string | null;
  meetingUrl: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface StudentApplication {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  nationality: string;
  questions: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  totpEnabled: boolean;
}

export interface LoginResponse {
  mfaRequired: boolean;
  accessToken?: string;
  mfaToken?: string;
  tokenType: string;
  expiresIn: number;
}

export interface MfaSetupResponse {
  otpAuthUrl: string;
  qrCodeDataUrl: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
