// backend/src/services/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/user.model";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: any;   // sanitized user (no password)
  token: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "changeme-secret";

// helper: remove password from user object
function sanitizeUser(user: IUser) {
  const obj = user.toObject();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = obj;
  return rest;
}

function generateToken(user: IUser): string {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// REGISTER
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const { name, email, password, role } = input;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error("Email is already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || "user",
  });

  const token = generateToken(user);
  return {
    user: sanitizeUser(user),
    token,
  };
}

// LOGIN
export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user);
  return {
    user: sanitizeUser(user),
    token,
  };
}

// FIND USER BY ID (used in AuthController.me)
export async function findUserById(userId: string) {
  if (!userId) return null;
  return User.findById(userId);
}

// SEED DEFAULT USERS (called in server.ts)
export async function seedDefaultUsers(): Promise<void> {
  // default admin
  const adminEmail = "admin@lifelog.com";
  const userEmail = "user@lifelog.com";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash("admin123", 10);
    await User.create({
      name: "Admin",
      email: adminEmail,
      password: hashed,
      role: "admin",
    });
    console.log("👑 Seeded default admin: admin@lifelog.com / admin123");
  }

  const existingUser = await User.findOne({ email: userEmail });
  if (!existingUser) {
    const hashed = await bcrypt.hash("user123", 10);
    await User.create({
      name: "Demo User",
      email: userEmail,
      password: hashed,
      role: "user",
    });
    console.log("👤 Seeded default user: user@lifelog.com / user123");
  }
}
