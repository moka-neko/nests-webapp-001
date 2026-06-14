import type { TeacherApplication } from './types';

const STORAGE_KEY = 'teacher_application_result';

export function saveTeacherResult(data: TeacherApplication): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getTeacherResult(): TeacherApplication | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TeacherApplication;
  } catch {
    return null;
  }
}
