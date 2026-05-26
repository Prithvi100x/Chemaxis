import type { JWTPayload } from "../lib/jwt.js";

declare global {
  namespace Express {
    interface Request {
      jwtUser?: JWTPayload;
    }
  }
}

export {};
