import { Router, Response } from "express";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { User } from "../models/user.model";

const router = Router();

// Admin-only: get all users
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const users = await User.find().select("-password");
      return res.status(200).json({ users });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  }
);

export default router;
