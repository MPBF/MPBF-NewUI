/**
 * This script patches Vite's HMR client to avoid WebSocket connection errors in Replit
 * 
 * This directly modifies the Vite client's WebSocket setup code to work in Replit's environment
 * by overriding the WebSocket constructor and intercepting Vite HMR connections.
 */

// Define a more direct fix for Vite WebSocket issues
(function patchViteHMR() {
  // Store references to the original methods
  const originalWebSocket = window.WebSocket;
  
  // Create a patched WebSocket constructor
  function PatchedWebSocket(urlOrOriginal: string | URL, protocols?: string | string[]) {
    // Check if this looks like a Vite HMR connection
    if (typeof urlOrOriginal === 'string' && urlOrOriginal.includes('?token=')) {
      try {
        console.log('Intercepting potential Vite HMR WebSocket connection:', urlOrOriginal);
        
        // Extract the token from the original URL
        let token = '';
        const tokenMatch = urlOrOriginal.match(/[?&]token=([^&]*)/);
        if (tokenMatch && tokenMatch[1]) {
          token = tokenMatch[1];
        }
        
        // Create a new URL using the current host
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const newUrl = `${protocol}//${host}/?token=${token}`;
        
        console.log('Patched WebSocket URL:', newUrl);
        
        // Call the original constructor with the fixed URL
        return new originalWebSocket(newUrl, protocols);
      } catch (err) {
        console.error('Error patching Vite WebSocket URL:', err);
        // Fall back to original
        return new originalWebSocket(urlOrOriginal, protocols);
      }
    }
    
    // For non-Vite connections, use the original constructor
    return new originalWebSocket(urlOrOriginal, protocols);
  }
  
  // Copy over static properties
  PatchedWebSocket.prototype = originalWebSocket.prototype;
  PatchedWebSocket.CONNECTING = originalWebSocket.CONNECTING;
  PatchedWebSocket.OPEN = originalWebSocket.OPEN;
  PatchedWebSocket.CLOSING = originalWebSocket.CLOSING;
  PatchedWebSocket.CLOSED = originalWebSocket.CLOSED;
  
  // Override the WebSocket constructor
  window.WebSocket = PatchedWebSocket as any;
})();

console.log('Vite HMR WebSocket patch installed');

// This is an empty export to make TypeScript treat this as a module
export {};