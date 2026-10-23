
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { session, user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(adminOnly);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isLoading && !session) {
      toast({
        title: "Authentication required",
        description: "Please log in to access this page",
        variant: "destructive",
      });
    }
  }, [isLoading, session, toast]);

  useEffect(() => {
    if (!adminOnly || isLoading) return;
    if (!user) {
      setIsCheckingAdmin(false);
      return;
    }

    let isActive = true;
    setIsCheckingAdmin(true);
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isActive) return;
        setIsAdmin(!error && data?.role === "admin");
        setIsCheckingAdmin(false);
      });

    return () => {
      isActive = false;
    };
  }, [adminOnly, isLoading, user]);

  // While checking authentication status, show nothing
  if (isLoading || (adminOnly && isCheckingAdmin)) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Not authenticated, redirect to login
  if (!session || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
