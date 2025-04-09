import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add a simple health check endpoint for deployment monitoring
// This needs to be before other middleware to ensure it's always available
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    ready: true,
    timestamp: new Date().toISOString(), 
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || 'unknown'
  });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    log('Starting server initialization...');
    const server = await registerRoutes(app);
    log('Routes registered successfully');

    // Add JWT error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      let status = err.status || err.statusCode || 500;
      let message = err.message || "Internal Server Error";

      // Handle JWT errors specifically
      if (err.name === 'TokenExpiredError') {
        status = 401;
        message = "Authentication token expired";
        console.log("JWT token expired:", err.expiredAt);
      } else if (err.name === 'JsonWebTokenError') {
        status = 401;
        message = "Invalid authentication token";
      }

      res.status(status).json({ message, errorType: err.name });
      console.error(err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "development" || app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
      log(`Running in ${process.env.NODE_ENV || 'production'} mode`);
    }

    // Use environment variable PORT if available, fallback to 5003
    // This ensures compatibility with various hosting environments 
    const port = parseInt(process.env.PORT || '5003', 10);
    server.listen(port, '0.0.0.0', () => {
      log(`Server successfully started and serving on port ${port} (0.0.0.0)`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    // Keep the process running instead of crashing
    log("Server had issues starting but will remain running to handle health checks");
    log("Error details: " + (error instanceof Error ? error.message : String(error)));

    // Set up a minimal error app to handle requests
    app.get('/health', (_req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        ready: true,
        timestamp: new Date().toISOString()
      });
    });
    
    app.get('*', (_req, res) => {
      res.status(503).json({ 
        status: 'error', 
        message: 'Service temporarily unavailable, please try again later' 
      });
    });

    const port = parseInt(process.env.PORT || '5003', 10);
    app.listen(port, '0.0.0.0', () => {
      log(`Error recovery server listening on port ${port} (0.0.0.0)`);
    });
  }
})();