// backend/src/controllers/auth.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  loginUser,
  registerUser,
  findUserById,
} from "../services/auth.service";

export class AuthController {
  static async register(req: AuthRequest, res: Response) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ message: "Name, email and password are required" });
      }

      const result = await registerUser({
        name,
        email,
        password,
        role: "user",
      });

      return res.status(201).json({
        message: "User registered successfully",
        user: result.user,
        token: result.token,
      });
    } catch (err: any) {
      console.error(err);
      return res
        .status(400)
        .json({ message: err.message || "Registration failed" });
    }
  }

  static async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const result = await loginUser({ email, password });

      return res.status(200).json({
        message: "Login successful",
        user: result.user,
        token: result.token,
      });
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ message: err.message || "Login failed" });
    }
  }

  // simple stateless logout; client just discards token
  static async logout(_req: AuthRequest, res: Response) {
    return res.status(200).json({ message: "Logged out successfully" });
  }

  static async me(req: AuthRequest, res: Response) {
    try {
      // our middleware sets req.userId (string)
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await findUserById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...rest } = user.toObject();
      return res.status(200).json({ user: rest });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Failed to fetch user profile" });
    }
  }
}
