import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

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
