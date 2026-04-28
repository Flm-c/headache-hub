import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  /**
   * When true, unapproved users are redirected to /dashboard even if their role matches.
   * Use for admin/editor areas that should only be accessible after admin approval.
   */
  requireApproved?: boolean;
}

export default function ProtectedRoute({ allowedRoles, requireApproved }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="py-16 text-center text-gray-600">Loading session...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireApproved && !user.isApproved) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
