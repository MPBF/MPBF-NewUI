import { apiRequest } from './queryClient';

// Store the JWT token
export const setAuthToken = (token: string) => {
  if (!token) {
    console.warn('Attempted to set empty auth token');
    return;
  }
  localStorage.setItem('authToken', token);
  console.log('Auth token stored successfully');
};

// Retrieve the JWT token
export const getAuthToken = (): string | null => {
  const token = localStorage.getItem('authToken');
  return token;
};

// Validate token format (basic check)
export const isValidTokenFormat = (token: string | null): boolean => {
  if (!token) return false;

  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  return parts.length === 3;
};

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch (e) {
    console.error('Error checking token expiration:', e);
    return true; // If we can't check, assume it's expired for safety
  }
};

// Function to handle authentication checks
export const checkAuth = async (): Promise<boolean> => {
  try {
    const token = getAuthToken();

    if (!token) {
      console.log('[Auth] No token found');
      return false;
    }

    // Check if token is expired before making API call
    if (isTokenExpired(token)) {
      console.log('[Auth] Token expired, clearing authentication');
      removeAuthToken();
      return false;
    }

    // Verify token with backend
    await apiRequest('/api/user');
    return true;
  } catch (error) {
    console.error('[Auth] Error checking authentication:', error);
    removeAuthToken();
    return false;
  }
};

// Login function
export const login = async (username: string, password: string): Promise<any> => {
  try {
    const response = await apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.token) {
      setAuthToken(response.token);
      return response.user;
    }
    throw new Error('No token received from server');
  } catch (error) {
    console.error('[Auth] Login failed:', error);
    throw error;
  }
};

// Logout function
export const logout = (): void => {
  removeAuthToken();
  // Optionally notify the server (though with JWT this isn't strictly necessary)
  try {
    apiRequest('/api/logout', { method: 'POST' }).catch(e => console.log('Logout notification error:', e));
  } catch (e) {
    // Ignore errors during logout notification
  }
};