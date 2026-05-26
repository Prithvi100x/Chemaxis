import { type Request, type Response, type NextFunction } from "express";
import { verifyToken, COOKIE_NAME } from "../lib/jwt.js";

export function jwtMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.jwtUser = payload;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.jwtUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
