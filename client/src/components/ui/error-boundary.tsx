import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { motion } from 'framer-motion';
import { fadeIn } from '../../utils/animations';
import { useToast } from '../../hooks/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRateLimited: boolean;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the child component tree
 */
class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRateLimited: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a rate limiting error
    const isRateLimited = error.message.includes('RATE_LIMIT_EXCEEDED') || 
                          error.message.includes('429') ||
                          error.message.includes('Too Many Requests') ||
                          error.message.includes('App Unavailable');
    
    // Check if this is a temporary server error like a 502
    const isTemporaryServerError = error.message.includes('502') || 
                                   error.message.includes('Gateway') ||
                                   error.message.includes('SERVER_ERROR');
    
    return {
      hasError: true,
      error,
      errorInfo: null,
      isRateLimited: isRateLimited || isTemporaryServerError, // Treat gateway errors as retryable like rate limits
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if this is a rate limiting error
    const isRateLimited = error.message.includes('RATE_LIMIT_EXCEEDED') || 
                          error.message.includes('429') ||
                          error.message.includes('Too Many Requests') ||
                          error.message.includes('App Unavailable');
    
    // Check if this is a temporary server error like a 502
    const isTemporaryServerError = error.message.includes('502') || 
                                   error.message.includes('Gateway') ||
                                   error.message.includes('SERVER_ERROR');
    
    this.setState({
      error,
      errorInfo,
      isRateLimited: isRateLimited || isTemporaryServerError, // Treat gateway errors as retryable like rate limits
    });
    
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  handleRetry = () => {
    // Reset error state and retry
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRateLimited: false,
    });
    
    // Force a reload if it's a rate limiting issue
    if (this.state.isRateLimited) {
      // Wait a moment before reloading to avoid hitting rate limits again immediately
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  render() {
    if (this.state.hasError) {
      // Render the fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render default error UI
      return (
        <motion.div
          className="flex items-center justify-center min-h-screen p-4"
          {...fadeIn}
        >
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <AlertCircle className="h-6 w-6 mr-2 text-red-500" />
                {this.state.isRateLimited 
                  ? (this.state.error?.message?.includes('502') || this.state.error?.message?.includes('Gateway') 
                    ? "Server Connection Issue" 
                    : "Rate Limit Exceeded")
                  : "Something went wrong"}
              </CardTitle>
              <CardDescription>
                {this.state.isRateLimited 
                  ? (this.state.error?.message?.includes('502') || this.state.error?.message?.includes('Gateway')
                    ? "The server is temporarily unavailable. This is usually resolved quickly. Retrying automatically."
                    : "The application is experiencing high traffic. Please try again in a moment.")
                  : "An unexpected error occurred in the application."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!this.state.isRateLimited && this.state.error && (
                <div className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-32">
                  {this.state.error.toString()}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to use hooks with class component
export function ErrorBoundary(props: Props) {
  const { toast } = useToast();
  
  // Handle toast for errors when they occur
  const handleError = (error: Error) => {
    if (error.message.includes('RATE_LIMIT_EXCEEDED') || 
        error.message.includes('429') ||
        error.message.includes('Too Many Requests') ||
        error.message.includes('App Unavailable')) {
      toast({
        title: "Rate Limit Exceeded",
        description: "The application is experiencing high traffic. Auto-retrying...",
        duration: 5000,
      });
    } else if (error.message.includes('502') || 
               error.message.includes('Gateway') ||
               error.message.includes('SERVER_ERROR')) {
      toast({
        title: "Server Issue Detected",
        description: "There was a temporary server connection issue. Auto-retrying...",
        duration: 5000,
      });
    }
  };
  
  // Use effect to handle errors globally
  React.useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      if (event.error) {
        handleError(event.error);
      }
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);
  
  return <ErrorBoundaryClass {...props} />;
}