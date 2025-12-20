import * as React from "react";
// PrivateRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from "lucide-react";

export function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
}