import "express-session";
import type { JWTPayload } from "../lib/jwt.js";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userName?: string;
    userEmail?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      jwtUser?: JWTPayload;
    }
  }
}
