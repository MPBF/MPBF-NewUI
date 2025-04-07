import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/utils/auth";
import LoginForm from "@/components/ui/login-form";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size="large" className="mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">MPBF System</h1>
          <p className="text-slate-500">Modern Plastic Bag Factory</p>
        </div>
        <LoginForm />
        <p className="text-center mt-8 text-sm text-slate-500">
          MPBF Production Management System v1.0.0
        </p>
      </div>
    </div>
  );
}
