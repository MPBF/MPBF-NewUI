import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../utils/auth';
import { Logo } from '@/components/ui/logo';
import { motion } from 'framer-motion';
import { LogIn, Lock, User } from 'lucide-react';

export default function SimpleLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [, setLocation] = useLocation();
  
  // Use auth context instead of manual login
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Use the login function from auth context
      await login(username, password);
      
      // After successful login, our auth provider will handle token storage
      // No need to redirect, the app will do it automatically based on authentication state
    } catch (err) {
      // Error handling is done by the auth provider
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg border border-slate-200"
      >
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Logo size="extra-large" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">MPBF System</h1>
          <p className="text-slate-600 mt-2">Modern Plastic Bag Factory</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-md bg-red-50 p-4 text-red-800 border border-red-200"
          >
            <div className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-slate-300 pl-10 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                required
                placeholder="Enter your username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 pl-10 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                required
                placeholder="Enter your password"
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center rounded-md bg-primary py-2.5 font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center">
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </span>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>MPBF Production Management System v1.0.0</p>
        </div>
      </motion.div>
    </div>
  );
}