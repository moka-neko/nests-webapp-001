export type TeacherStatus = 'PENDING' | 'INTERVIEW' | 'HIRED' | 'REJECTED';

export interface ResumeHistoryEntry {
  yearMonth: string;
  description: string;
}

export interface TeacherResume {
  photoUrl: string | null;
  birthDate: string | null;
  gender: string | null;
  phoneNumber: string | null;
  postalCode: string | null;
  address: string | null;
  nearestStation: string | null;
  education: ResumeHistoryEntry[] | null;
  workHistory: ResumeHistoryEntry[] | null;
  qualifications: ResumeHistoryEntry[] | null;
  motivation: string | null;
  selfPromotion: string | null;
  hobbies: string | null;
  requests: string | null;
}

export interface TeacherApplication {
  id: string;
  email: string;
  nameKanji: string;
  nameKatakana: string;
  age: number;
  workLocation: string;
  resumeUrl: string | null;
  resume: TeacherResume | null;
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

export interface AdminUser extends AdminProfile {
  createdAt: string;
}

export interface CreateAdminUserRequest {
  email: string;
  password: string;
  name: string;
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
