import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

/**
 * Component that displays the current network status
 * and notifies users of connectivity issues
 */
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Update state when online/offline status changes
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "Your internet connection has been restored.",
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      toast({
        title: "Connection Lost",
        description: "You appear to be offline. Some features may be unavailable.",
        duration: 5000,
        variant: "destructive",
      });
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Hide banner after 5 seconds if offline state persists
  useEffect(() => {
    let timer: number;
    if (!isOnline && showBanner) {
      timer = window.setTimeout(() => {
        setShowBanner(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isOnline, showBanner]);

  // No need to show anything when online
  if (isOnline) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 inset-x-0 z-50"
        >
          <div className="bg-red-500 text-white flex items-center justify-center p-2 shadow-md">
            <WifiOff className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              You are currently offline. Some features may be unavailable.
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}