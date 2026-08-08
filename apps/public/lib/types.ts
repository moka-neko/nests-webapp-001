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
  status: string;
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

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
