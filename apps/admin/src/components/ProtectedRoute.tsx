import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAccessToken, saveRedirectAfterLogin } from '../lib/auth';
import { Layout } from './Layout';

export function ProtectedRoute() {
  const location = useLocation();
  const token = getAccessToken();
  if (!token) {
    saveRedirectAfterLogin(
      `${location.pathname}${location.search}${location.hash}`,
    );
    return <Navigate to="/login" replace />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
