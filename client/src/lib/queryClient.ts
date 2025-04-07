import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Handle rate limiting (429) errors specially
    if (res.status === 429) {
      console.warn("Rate limit exceeded. Will retry after a delay.");
      // Throw a special error that can be handled by the UI
      throw new Error(`RATE_LIMIT_EXCEEDED: The server is experiencing high load. Please try again in a moment.`);
    }
    
    // Handle server errors (5xx) with special message
    if (res.status >= 500) {
      // More detailed logging for 502 errors specifically
      if (res.status === 502) {
        console.error(`Gateway error (502): The server might be restarting or under high load at ${new Date().toISOString()}. URL: ${res.url}`);
      } else {
        console.error(`Server error: ${res.status} at ${new Date().toISOString()}. URL: ${res.url}`);
      }
      throw new Error(`SERVER_ERROR: The server encountered an error. This is not your fault, please try again later.`);
    }
    
    // Handle network errors
    if (res.status === 0 || res.type === 'opaque') {
      console.error("Network error or CORS issue");
      throw new Error(`NETWORK_ERROR: Unable to connect to the server. Please check your internet connection.`);
    }
    
    // Handle other errors
    try {
      // Clone the response to avoid consuming the body stream twice
      const clonedRes = res.clone();
      const text = await res.text();
      
      // Handle Replit-specific unavailability
      const url = res.url || '';
      if (url.includes('replit.app') || url.includes('replit.dev') || url.includes('replit.co')) {
        if (text.includes('App Unavailable') || text.includes('too many requests')) {
          console.warn("Replit app unavailable or rate limited. Will retry.");
          throw new Error(`RATE_LIMIT_EXCEEDED: The application is temporarily unavailable. Please try again in a moment.`);
        }
      }
      
      // Try to parse as JSON to get a more meaningful error message
      try {
        const jsonError = JSON.parse(text);
        if (jsonError.message) {
          throw new Error(`${res.status}: ${jsonError.message}`);
        }
      } catch (e) {
        // Not JSON or no message property, use the text as is
      }
      throw new Error(`${res.status}: ${text || clonedRes.statusText}`);
    } catch (error) {
      if (error instanceof Error) {
        throw error; // Re-throw if it's already an Error
      }
      // Fallback error
      throw new Error(`${res.status}: ${res.statusText || 'Unknown error'}`);
    }
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: any,
  options?: RequestInit,
): Promise<T> {
  console.log(`API Request: ${method} ${url}`, data);
  
  // Get the JWT token
  const token = getAuthToken();
  
  // Prepare headers
  const headers: Record<string, string> = options?.headers ? 
    { ...options.headers as Record<string, string> } : {};
  
  // Create a proper options object
  const requestOptions: RequestInit = {
    ...options,
    method,
    headers,
  };
  
  // If there's data, stringify it and set content type
  if (data) {
    requestOptions.body = JSON.stringify(data);
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }
  
  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  // Special case for order creation with retry logic
  if (method === 'POST' && url === '/api/orders') {
    console.log("SPECIAL HANDLING: Order creation with retry logic");
    return await createOrderWithRetry(url, requestOptions);
  }
  
  // Standard request
  const res = await fetch(url, requestOptions);

  await throwIfResNotOk(res);
  
  // Return JSON if the response has content, otherwise return empty object
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const jsonResponse = await res.json();
    console.log(`API Response: ${method} ${url}`, jsonResponse);
    return jsonResponse as T;
  }
  
  // If response is empty or not JSON, return an empty object as T
  console.log(`API Response: ${method} ${url} (empty/non-JSON response)`);
  return {} as T;
}

// Special function for creating orders with retry logic
async function createOrderWithRetry<T>(url: string, options: RequestInit, retries = 3): Promise<T> {
  console.log(`Attempting to create order (retries left: ${retries})`);
  
  try {
    const res = await fetch(url, options);
    
    // If request was successful, process response
    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const jsonResponse = await res.json();
        console.log("Order creation successful, response:", jsonResponse);
        
        // Verify we got an id back
        if (!jsonResponse.id) {
          console.warn("Order creation response missing ID:", jsonResponse);
        }
        
        return jsonResponse as T;
      }
      return {} as T;
    }
    
    // If we have retries left and it's a server error (5xx), retry
    if (retries > 0 && res.status >= 500) {
      console.warn(`Server error ${res.status} creating order. Retrying...`);
      const delay = 1000; // 1 second delay between retries
      await new Promise(resolve => setTimeout(resolve, delay));
      return createOrderWithRetry(url, options, retries - 1);
    }
    
    // Otherwise, handle error normally
    await throwIfResNotOk(res);
    
    // Should never reach here due to throwIfResNotOk, but TypeScript needs a return
    return {} as T;
  } catch (error) {
    console.error("Error creating order:", error);
    
    // If we have retries left and it's a network error, retry
    if (retries > 0 && error instanceof Error && 
       (error.message.includes('NETWORK_ERROR') || error.message.includes('failed to fetch'))) {
      console.warn("Network error creating order. Retrying...");
      const delay = 1000; // 1 second delay between retries
      await new Promise(resolve => setTimeout(resolve, delay));
      return createOrderWithRetry(url, options, retries - 1);
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the JWT token
    const token = getAuthToken();
    
    // Prepare headers
    const headers: Record<string, string> = {};
    
    // Add Authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Helper function to determine if an error is retryable
const isRetryableError = (error: unknown): boolean => {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for 502 errors specifically (Gateway errors)
  const isGatewayError = errorMessage.includes('502') || 
                         errorMessage.includes('Gateway') ||
                         errorMessage.includes('Bad Gateway');
  
  // Errors that should trigger retries
  return (
    errorMessage.includes('RATE_LIMIT_EXCEEDED') || // Rate limiting (429)
    errorMessage.includes('SERVER_ERROR') ||        // Server errors (5xx)
    errorMessage.includes('NETWORK_ERROR') ||       // Network connectivity issues
    errorMessage.includes('ECONNRESET') ||          // Connection reset
    errorMessage.includes('ETIMEDOUT') ||           // Connection timeout
    errorMessage.includes('ECONNREFUSED') ||        // Connection refused
    errorMessage.includes('429') ||                 // HTTP 429 Too Many Requests
    errorMessage.includes('Too Many Requests') ||   // Descriptive rate limiting 
    errorMessage.includes('App Unavailable') ||     // Replit-specific unavailability
    isGatewayError                                  // Gateway errors (502)
  );
};

/**
 * Check the system health status
 * @returns Promise with health data or throws an error
 */
export async function checkSystemHealth(): Promise<{
  status: string;
  version: string;
  uptime: number;
  timestamp: string;
  database: {
    status: string;
    connectionTime: number;
  };
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
  };
}> {
  try {
    const response = await fetch('/api/health');
    
    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      // Enhanced retry logic for various error types
      retry: (failureCount, error) => {
        // Maximum number of retries
        const MAX_RETRIES = 3;
        
        // Stop retrying after max attempts
        if (failureCount >= MAX_RETRIES) {
          console.warn(`Query failed after ${MAX_RETRIES} retries`, error);
          return false;
        }
        
        // Check if this is a retryable error
        const shouldRetry = isRetryableError(error);
        
        if (shouldRetry) {
          console.info(`Retrying query (attempt ${failureCount + 1}/${MAX_RETRIES})...`);
        }
        
        return shouldRetry;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff with jitter
        // Base: 1s, 2s, 4s, etc. + random jitter of up to 25%
        const baseDelay = Math.min(1000 * (2 ** attemptIndex), 30000);
        const jitter = Math.random() * 0.25 * baseDelay;
        return baseDelay + jitter;
      },
    },
    mutations: {
      // Similar enhanced retry logic for mutations
      retry: (failureCount, error) => {
        const MAX_RETRIES = 2; // Fewer retries for mutations as they modify data
        
        if (failureCount >= MAX_RETRIES) {
          console.warn(`Mutation failed after ${MAX_RETRIES} retries`, error);
          return false;
        }
        
        const shouldRetry = isRetryableError(error);
        
        if (shouldRetry) {
          console.info(`Retrying mutation (attempt ${failureCount + 1}/${MAX_RETRIES})...`);
        }
        
        return shouldRetry;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff with jitter
        const baseDelay = Math.min(1000 * (2 ** attemptIndex), 15000);
        const jitter = Math.random() * 0.25 * baseDelay;
        return baseDelay + jitter;
      },
    },
  },
});
