import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  mobile?: string;
  section?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  error: null,
  token: null,
});

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to get stored token
const getStoredToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to store token
const storeToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Helper function to remove token
const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in using token
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("[AuthProvider] Checking auth status");
        // If we have a token, try to get user data
        if (token) {
          console.log("[AuthProvider] Token found, attempting to validate");
          
          // Similar to login, try multiple URL variations to handle proxy issues
          const urlsToTry = [
            '/api/user',                  // Relative URL with leading slash (standard)
            'api/user',                   // Relative URL without leading slash
            'http://localhost:5000/api/user' // Absolute URL with localhost
          ];
          
          let userData = null;
          
          // Try each URL until one works
          for (const url of urlsToTry) {
            try {
              console.log(`[AuthProvider] Trying to validate token with URL: ${url}`);
              
              const response = await fetch(url, {
                headers: {
                  'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
              });
              
              console.log(`[AuthProvider] Auth status response for ${url}:`, response.status);
              
              // If successful, save the data and break the loop
              if (response.ok) {
                userData = await response.json();
                console.log(`[AuthProvider] User data retrieved via ${url}:`, userData);
                break;
              }
              
              // If unauthorized, try to refresh the token
              if (response.status === 401) {
                // Try to refresh the token
                try {
                  const refreshResponse = await fetch('/api/refresh-session', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                  });
                  
                  if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    if (refreshData.token) {
                      console.log('[AuthProvider] Successfully refreshed token');
                      storeToken(refreshData.token);
                      setToken(refreshData.token);
                      setUser(refreshData.user);
                      userData = refreshData.user;
                      break;
                    }
                  } else {
                    console.warn("[AuthProvider] Invalid token, clearing authentication");
                    removeToken();
                    setToken(null);
                    break;
                  }
                } catch (refreshErr) {
                  console.warn("[AuthProvider] Error refreshing token:", refreshErr);
                  removeToken();
                  setToken(null);
                  break;
                }
              }
              
              // Otherwise, try the next URL
            } catch (err) {
              console.warn(`[AuthProvider] Error trying ${url}:`, err);
              // Continue to next URL
            }
          }
          
          // If we got user data, set the user
          if (userData) {
            setUser(userData);
          } else if (token) {
            // If we have a token but couldn't validate it with any URL, clear it
            console.warn("[AuthProvider] Could not validate token with any URL, clearing authentication");
            removeToken();
            setToken(null);
          }
        } else {
          console.log("[AuthProvider] No token found");
        }
      } catch (err) {
        console.error('[AuthProvider] Error checking auth status:', err);
        // Clear potentially invalid token
        removeToken();
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [token]);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("[AuthProvider] Attempting login with username:", username);
      
      // Try several approaches to handle possible proxy or network issues
      let data;
      let successfulUrl = '';
      
      // List of URLs to try
      const urlsToTry = [
        '/api/login',                  // Relative URL with leading slash (standard)
        'api/login',                   // Relative URL without leading slash
        'http://localhost:5000/api/login' // Absolute URL with localhost
      ];
      
      // Try each URL until one works
      for (const url of urlsToTry) {
        try {
          console.log(`[AuthProvider] Trying login with URL: ${url}`);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            // Include credentials to ensure cookies are sent/received 
            credentials: 'include'
          });
          
          console.log(`[AuthProvider] Login response status for ${url}:`, response.status);
          
          // If successful, save the data and break the loop
          if (response.ok) {
            data = await response.json();
            successfulUrl = url;
            console.log(`[AuthProvider] Login successful via ${url}`);
            break;
          }
          
          // If unauthorized (wrong credentials), no need to try other URLs
          if (response.status === 401) {
            throw new Error('Invalid username or password');
          }
          
          // Otherwise, try the next URL
        } catch (err) {
          console.warn(`[AuthProvider] Error trying ${url}:`, err);
          // Continue to next URL
        }
      }
      
      // If we didn't get data from any URL, throw an error
      if (!data) {
        throw new Error('Could not connect to login service after multiple attempts');
      }
      
      console.log("[AuthProvider] Login successful, received data:", { 
        ...data, 
        token: data.token ? `${data.token.substring(0, 10)}...` : undefined 
      });
      console.log("[AuthProvider] Used successful URL:", successfulUrl);
      
      if (data.token) {
        // Store token in localStorage
        storeToken(data.token);
        setToken(data.token);
        
        if (data.user) {
          console.log("[AuthProvider] Setting user data:", data.user);
          setUser(data.user);
        } else {
          console.warn("[AuthProvider] No user data in response");
        }
      } else {
        console.warn("[AuthProvider] No token in response");
        // Fallback for backward compatibility
        setUser(data);
      }
    } catch (err: any) {
      console.error("[AuthProvider] Login error:", err);
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // With JWT, we just need to remove the token client-side
      // The API call is optional since JWT is stateless, but we'll try to make it
      
      // Try multiple URL variations for consistent approach
      const urlsToTry = [
        '/api/logout',                  // Relative URL with leading slash (standard)
        'api/logout',                   // Relative URL without leading slash
        'http://localhost:5000/api/logout' // Absolute URL with localhost
      ];
      
      let logoutSuccessful = false;
      
      // Try each URL until one works
      for (const url of urlsToTry) {
        try {
          console.log(`[AuthProvider] Trying logout with URL: ${url}`);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: token ? {
              'Authorization': `Bearer ${token}`
            } : undefined,
            credentials: 'include'
          });
          
          // If successful, break the loop
          if (response.ok) {
            logoutSuccessful = true;
            console.log(`[AuthProvider] Logout successful via ${url}`);
            break;
          }
        } catch (err) {
          console.warn(`[AuthProvider] Error trying logout with ${url}:`, err);
          // Continue to next URL
        }
      }
      
      if (!logoutSuccessful) {
        console.warn("[AuthProvider] Could not reach logout endpoint, but will still clear local state");
      }
      
      // Remove token and user regardless of API call success
      removeToken();
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
      // Even if the API call fails, we should still clear local state
      removeToken();
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        error,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
