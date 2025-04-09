import { useCallback } from 'react';
import { useToast } from './use-toast';
import { useAuth } from '../utils/auth';

interface ApiOptions {
  showErrors?: boolean;
}

export function useApi() {
  const { toast } = useToast();
  const { token } = useAuth();

  // Function to handle API responses
  const handleResponse = useCallback(async (response: Response, showErrors: boolean = true) => {
    if (!response.ok) {
      // Try to parse the error message
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || 'An error occurred';
      } catch (e) {
        // Couldn't parse JSON, use status text
        errorMessage = response.statusText || 'An error occurred';
      }

      // Show toast if showErrors is true
      if (showErrors) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }

      throw new Error(errorMessage);
    }

    // Return the response data
    try {
      return await response.json();
    } catch (e) {
      // If no JSON data is returned (e.g., for DELETE requests)
      return { success: true };
    }
  }, [toast]);

  // GET request
  const get = useCallback(async (url: string, options: ApiOptions = {}) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return handleResponse(response, options.showErrors);
  }, [token, handleResponse]);

  // POST request
  const post = useCallback(async (url: string, data: any, options: ApiOptions = {}) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response, options.showErrors);
  }, [token, handleResponse]);

  // PUT request
  const put = useCallback(async (url: string, data: any, options: ApiOptions = {}) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response, options.showErrors);
  }, [token, handleResponse]);

  // PATCH request
  const patch = useCallback(async (url: string, data: any, options: ApiOptions = {}) => {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response, options.showErrors);
  }, [token, handleResponse]);

  // DELETE request
  const del = useCallback(async (url: string, options: ApiOptions = {}) => {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return handleResponse(response, options.showErrors);
  }, [token, handleResponse]);

  return { get, post, put, patch, del };
}