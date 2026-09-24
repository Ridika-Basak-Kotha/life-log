// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  role: "user" | "admin";
}

// extend Request so we can attach user info
export interface AuthedRequest extends Request {
  userId?: string;
  role?: "user" | "admin";
  user?: { id: string; role?: "user" | "admin" };
}

// alias so old code using AuthRequest still works
export type AuthRequest = AuthedRequest;

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// main auth middleware (requires ANY logged-in user)
export const requireAuth = (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.userId = decoded.userId;
    req.role = decoded.role;
    // keep backward compatibility with old code using req.user.id
    req.user = { id: decoded.userId, role: decoded.role };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// alias name used in routes
export const authMiddleware = requireAuth;

// 🔒 admin-only guard
export const adminMiddleware = (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};
