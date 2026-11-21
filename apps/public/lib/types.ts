export interface TeacherApplication {
  id: string;
  email: string;
  nameKanji: string;
  nameKatakana: string;
  age: number;
  workLocation: string;
  resumeUrl: string;
  questions: string | null;
  status: string;
  interviewCandidateDates?: string[];
  submittedAt: string;
  updatedAt: string;
}

export interface InterviewCandidateWindow {
  startDate: string;
  endDate: string;
  dates: { date: string; label: string }[];
}

export interface StudentApplication {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  nationality: string;
  desiredLessonsPerWeek: number | null;
  questions: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
