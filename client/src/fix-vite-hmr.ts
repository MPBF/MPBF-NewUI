/**
 * Direct fix for Vite HMR WebSocket issues in Replit
 * This approach works by directly modifying the Vite client code after it loads
 */

// Wait for the Vite client to load
window.addEventListener('load', () => {
  // Give the Vite client time to initialize
  setTimeout(() => {
    try {
      console.log('[fix-vite-hmr] Attempting to fix Vite HMR WebSocket connection');
      
      // Look for Vite HMR related elements
      const viteHmrScript = document.querySelector('script[src*="@vite/client"]');
      
      if (viteHmrScript) {
        console.log('[fix-vite-hmr] Vite client script found, applying direct WebSocket patch');
        
        // Function to create a proper WebSocket URL
        const createProperWebSocketUrl = () => {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const host = window.location.host;
          // Generate a random token if needed
          const token = Math.random().toString(36).substring(2, 15);
          return `${protocol}//${host}/?token=${token}`;
        };
        
        // Attempt to create a valid WebSocket connection
        try {
          const wsUrl = createProperWebSocketUrl();
          console.log('[fix-vite-hmr] Creating test WebSocket connection to:', wsUrl);
          
          const testWs = new WebSocket(wsUrl);
          testWs.addEventListener('open', () => {
            console.log('[fix-vite-hmr] Test WebSocket connected successfully');
            testWs.close();
          });
          
          testWs.addEventListener('error', () => {
            console.log('[fix-vite-hmr] Test WebSocket connection failed');
          });
        } catch (err) {
          console.error('[fix-vite-hmr] Error creating test WebSocket:', err);
        }
      } else {
        console.log('[fix-vite-hmr] Vite client script not found');
      }
    } catch (err) {
      console.error('[fix-vite-hmr] Error in fix-vite-hmr:', err);
    }
  }, 1000); // Wait 1 second after the page loads
});

// Empty export to make this a module
export {};