import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { MfaDisablePage } from './pages/MfaDisablePage';
import { MfaPage } from './pages/MfaPage';
import { MfaSetupPage } from './pages/MfaSetupPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentEditPage } from './pages/StudentEditPage';
import { StudentsListPage } from './pages/StudentsListPage';
import { TeacherDetailPage } from './pages/TeacherDetailPage';
import { TeacherEditPage } from './pages/TeacherEditPage';
import { TeachersListPage } from './pages/TeachersListPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/mfa" element={<MfaPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/teachers" element={<TeachersListPage />} />
            <Route path="/teachers/:id" element={<TeacherDetailPage />} />
            <Route path="/teachers/:id/edit" element={<TeacherEditPage />} />
            <Route path="/students" element={<StudentsListPage />} />
            <Route path="/students/:id/edit" element={<StudentEditPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/mfa/setup" element={<MfaSetupPage />} />
            <Route path="/settings/mfa/disable" element={<MfaDisablePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
