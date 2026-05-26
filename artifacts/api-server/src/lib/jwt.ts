import jwt from "jsonwebtoken";
import type { CookieOptions } from "express";

const JWT_SECRET =
  process.env.JWT_SECRET ?? "chemaxis-jwt-dev-secret-change-in-prod";

const JWT_EXPIRY = "7d";

export const COOKIE_NAME = "auth_token";

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const CLEAR_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
};

export interface JWTPayload {
  userId: number;
  name: string;
  email: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
