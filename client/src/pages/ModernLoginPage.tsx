import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/utils/auth";
import { Logo } from "@/components/ui/logo";
import LoginForm from "@/components/ui/login-form";
import { motion } from "framer-motion";

export default function ModernLoginPage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full h-full absolute inset-0 overflow-hidden">
      {/* Left section with background and branding */}
      <div className="md:w-1/2 bg-gradient-to-br from-teal-600 to-teal-800 flex flex-col items-center justify-center p-8 text-white">
        <motion.div 
          className="max-w-md mx-auto flex flex-col items-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="relative mb-8">
            <div className="absolute inset-0 bg-blue-300 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-white rounded-full p-3 shadow-lg">
              <Logo size="extra-large" />
            </div>
          </motion.div>
          <motion.h1 
            variants={itemVariants}
            className="text-4xl font-bold mb-4 text-center"
          >
            MPBF Production Management System
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-xl mb-8 text-center opacity-90"
          >
            Modern Plastic Bag Factory
          </motion.p>
          <motion.div 
            variants={itemVariants}
            className="space-y-4 text-center text-sm opacity-80"
          >
            <p>Optimize your manufacturing process with our complete management solution</p>
            <div className="flex justify-center gap-4 mt-6">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-white/20 w-12 h-12 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span>Orders</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-white/20 w-12 h-12 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span>Factory</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-white/20 w-12 h-12 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span>Analytics</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right section with login form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">
          <LoginForm />
        </motion.div>
      </div>
    </div>
  );
}