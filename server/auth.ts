import { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, ROLE_PERMISSIONS, USER_ROLES } from "@shared/schema";
import { storage } from "./storage";

// JWT Configuration - Make sure we use the same secret consistently
const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'mpbf-jwt-secret-key';
console.log('Using JWT secret from:', process.env.SESSION_SECRET ? 'SESSION_SECRET' : (process.env.JWT_SECRET ? 'JWT_SECRET' : 'default fallback'));
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // Token valid for 7 days (increased from 24h)

// JWT Payload Interface
interface JwtPayload {
  userId: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Add types to Express
declare global {
  namespace Express {
    // User interface in the Request
    interface User {
      id: number;
      username: string;
      name: string;
      role: string;
      mobile?: string | null;
      section?: string | null;
    }
    
    // Extend Request
    interface Request {
      token?: string;
      jwtPayload?: JwtPayload;
      user?: User;
      hasPermission?: (resource: string) => boolean;
      hasRole?: (role: string) => boolean;
    }
  }
}

// Create JWT Token
const generateToken = (user: User): string => {
  // Convert JWT_SECRET to Buffer if it's a string to fix type issues
  const secretBuffer = Buffer.from(JWT_SECRET, 'utf-8');
  
  // Use explicit SignOptions type for the options
  const options: jwt.SignOptions = { 
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  };
  
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username,
      role: user.role 
    },
    secretBuffer,
    options
  );
};
// Middleware to verify the JWT token
const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get auth header
    const authHeader = req.headers.authorization;
    
    // Check if auth header exists and starts with Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("No JWT token found in request");
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token using Buffer for consistency
    const secretBuffer = Buffer.from(JWT_SECRET, 'utf-8');
    const decoded = jwt.verify(token, secretBuffer) as JwtPayload;
    
    // Add token and payload to request
    req.token = token;
    req.jwtPayload = decoded;
    
    // Get user from database
    storage.getUser(decoded.userId)
      .then(user => {
        if (!user) {
          console.log(`User not found with ID: ${decoded.userId}`);
          return res.status(401).json({ message: "Invalid user" });
        }
        
        // Add user to request
        req.user = user;
        
        // Add permission helper function to request
        req.hasPermission = (resource: string) => {
          if (!user) return false;
          
          const userRole = user.role as keyof typeof ROLE_PERMISSIONS;
          const permissions = ROLE_PERMISSIONS[userRole] || [];
          
          return Array.isArray(permissions) && permissions.includes(resource as any);
        };
        
        // Add role helper function to request
        req.hasRole = (role: string) => {
          if (!user) return false;
          return user.role === role;
        };
        
        next();
      })
      .catch(err => {
        console.error("Error fetching user:", err);
        res.status(500).json({ message: "Server error" });
      });
  } catch (error) {
    console.error("JWT verification error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Optional JWT authentication - doesn't return error if no token is present
const optionalJwtAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Set default permission functions that always return false
      req.hasPermission = () => false;
      req.hasRole = () => false;
      return next(); // No token, but that's ok
    }
    
    const token = authHeader.split(' ')[1];
    const secretBuffer = Buffer.from(JWT_SECRET, 'utf-8');
    const decoded = jwt.verify(token, secretBuffer) as JwtPayload;
    
    req.token = token;
    req.jwtPayload = decoded;
    
    storage.getUser(decoded.userId)
      .then(user => {
        if (user) {
          req.user = user;
          
          // Add permission helper function to request
          req.hasPermission = (resource: string) => {
            if (!user) return false;
            
            const userRole = user.role as keyof typeof ROLE_PERMISSIONS;
            const permissions = ROLE_PERMISSIONS[userRole] || [];
            
            return Array.isArray(permissions) && permissions.includes(resource as any);
          };
          
          // Add role helper function to request
          req.hasRole = (role: string) => {
            if (!user) return false;
            return user.role === role;
          };
        } else {
          // Set default permission functions that always return false
          req.hasPermission = () => false;
          req.hasRole = () => false;
        }
        next();
      })
      .catch(() => {
        // Set default permission functions that always return false
        req.hasPermission = () => false;
        req.hasRole = () => false;
        next();
      });
  } catch (error) {
    // Set default permission functions that always return false
    req.hasPermission = () => false;
    req.hasRole = () => false;
    next(); // Continue even if token is invalid
  }
};

export function setupAuth(app: Express) {
  // Registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser({
        ...req.body,
        // In production, use password hashing
        password: req.body.password,
      });
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Don't send password back to the client
      const { password, ...safeUser } = user;
      
      // Return user data and token
      res.status(201).json({
        user: safeUser,
        token
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "An error occurred during registration" });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log(`Attempting login for username: ${username}`);
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log(`Login failed: User not found with username: ${username}`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // For development, accept plain text password
      // In production, we should use a secure password comparison
      if (user.password !== password) {
        console.log(`Login failed: Password mismatch for user: ${username}`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      console.log(`Login successful for user: ${username}, id: ${user.id}, role: ${user.role}`);
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Don't send password back to the client
      const { password: _, ...safeUser } = user;
      
      // Return user data and token
      res.status(200).json({
        user: safeUser,
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "An error occurred during login" });
    }
  });

  // Protected route to get current user
  app.get("/api/user", authenticateJwt, (req, res) => {
    // Don't send password back to the client
    const { password, ...safeUser } = req.user as User;
    res.json(safeUser);
  });

  // Logout endpoint (client-side only for JWT)
  app.post("/api/logout", (req, res) => {
    // JWT tokens can't be invalidated server-side without a blacklist
    // Client needs to remove the token from storage
    res.status(200).json({ message: "Logged out successfully" });
  });
  
  // Session refresh endpoint
  app.post("/api/refresh-session", optionalJwtAuth, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Get the full user from the database to ensure we have all properties
      const fullUser = await storage.getUser(req.user.id);
      
      if (!fullUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate a new token for the user
      const newToken = generateToken(fullUser);
      
      // Return the user data and new token
      const { password, ...safeUser } = fullUser;
      res.status(200).json({
        user: safeUser,
        token: newToken
      });
    } catch (error) {
      console.error("Error refreshing session:", error);
      res.status(500).json({ message: "An error occurred while refreshing the session" });
    }
  });

  // Middleware to check if user has the required permission
  const requirePermission = (resource: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Admin users should always have all permissions
      if (req.user.role === USER_ROLES.ADMIN) {
        return next();
      }
      
      if (!req.hasPermission || !req.hasPermission(resource)) {
        console.log(`Permission denied: User ${req.user.username} lacks permission for ${resource}`);
        return res.status(403).json({ message: "Permission denied" });
      }
      
      next();
    };
  };
  
  // Middleware to check if user has one of the required roles
  const requireRole = (roles: string | string[]) => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Admin users should have access to all roles
      if (req.user.role === USER_ROLES.ADMIN) {
        return next();
      }
      
      if (!req.hasRole || !roleArray.some(role => req.hasRole!(role))) {
        console.log(`Role check failed: User ${req.user.username} with role ${req.user.role} doesn't match required roles: ${roleArray.join(', ')}`);
        return res.status(403).json({ message: "Permission denied" });
      }
      
      next();
    };
  };
  
  // Add routes to check permissions and roles
  app.get("/api/check-permission/:resource", authenticateJwt, (req, res) => {
    const resource = req.params.resource;
    const hasPermission = req.hasPermission ? req.hasPermission(resource) : false;
    
    res.json({ 
      hasPermission,
      resource,
      user: {
        username: req.user?.username,
        role: req.user?.role
      }
    });
  });
  
  app.get("/api/check-role/:role", authenticateJwt, (req, res) => {
    const role = req.params.role;
    const hasRole = req.hasRole ? req.hasRole(role) : false;
    
    res.json({ 
      hasRole,
      requestedRole: role,
      currentRole: req.user?.role
    });
  });
  
  // Export middlewares for use in other routes
  return {
    authenticateJwt,
    optionalJwtAuth,
    generateToken,
    requirePermission,
    requireRole
  };
}