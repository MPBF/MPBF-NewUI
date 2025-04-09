// Import error suppression CSS first to hide error popups
// This hides Vite HMR WebSocket error messages
import './error-suppression.css';

// Import the WebSocket patches early
// These patch the WebSocket constructor before any connections are attempted
import './vite-hmr-patch';
import './fix-vite-hmr';

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress any remaining WebSocket errors as a fallback
window.addEventListener('error', (event) => {
  // More comprehensive check for WebSocket errors
  if (
    event.message && 
    (event.message.includes('WebSocket') || event.error instanceof DOMException) &&
    (event.message.includes('localhost:') || 
     event.message.includes('Failed to construct') ||
     event.message.includes('invalid') ||
     event.message.includes('URL') ||
     event.message.includes('token='))
  ) {
    // Prevent the error from appearing in console
    event.preventDefault();
    
    // Log a more helpful message
    console.warn('Suppressed Vite HMR WebSocket error. This is expected in Replit environment and doesn\'t affect application functionality.');
    
    return true; // Prevent default error handling
  }
  
  // Let other errors propagate normally
  return false;
});

// Handle unhandled promise rejections that might come from WebSocket issues
window.addEventListener('unhandledrejection', (event) => {
  // Check if this is a WebSocket related rejection
  const errorString = String(event.reason);
  
  // More comprehensive check for WebSocket related errors
  if ((errorString.includes('WebSocket') || event.reason instanceof DOMException) && 
      (errorString.includes('localhost:') || errorString.includes('Failed to construct') || 
       errorString.includes('invalid') || errorString.includes('URL'))) {
    // Prevent the error from appearing in console
    event.preventDefault();
    console.warn('Suppressed unhandled rejection from WebSocket. This is expected in Replit environment.');
    return true;
  }
  return false;
});

// Get the root element
const rootElement = document.getElementById("root");

// Add a console log to check if we're rendering
console.log("Rendering application to root element:", rootElement);

// Create a root and render the app
if (rootElement) {
  createRoot(rootElement).render(
    <App />
  );
} else {
  console.error("Root element not found in the DOM");
}
