import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
export function ProtectedRoute() {
  const {
    user,
    loading
  } = useAuth();
  if (loading) {
    return <div className="auth-shell">
        <span className="loading-line">LOADING SYSTEM...</span>
      </div>;
  }
  if (!user) return <Navigate to="/welcome" replace />;
  return <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Outlet />
      </div>
    </div>;
}