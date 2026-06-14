import { Navigate, Outlet } from 'react-router-dom';
import { getAccessToken } from '../lib/auth';
import { Layout } from './Layout';

export function ProtectedRoute() {
  const token = getAccessToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
