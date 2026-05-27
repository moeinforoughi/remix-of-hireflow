import { Reactخیرde } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserدسترسی‌ها } from '@/hooks/useUserدسترسی‌ها';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: Reactخیرde;
  requireنقش?: 'site_admin' | 'job_admin';
  requireOfferAccess?: boolean;
}

export const ProtectedRoute = ({ children, requireنقش, requireOfferAccess }: ProtectedRouteProps) => {
  const { role, canViewOffers, loading } = useUserدسترسی‌ها();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check role-based access
  if (requireنقش) {
    if (requireنقش === 'site_admin' && role !== 'site_admin') {
      return <Navigate to="/dashboard" replace />;
    }
    if (requireنقش === 'job_admin' && role !== 'site_admin' && role !== 'job_admin') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check offer access
  if (requireOfferAccess && !canViewOffers()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
