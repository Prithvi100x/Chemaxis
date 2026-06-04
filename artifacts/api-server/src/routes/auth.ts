import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "@workspace/db";
import {
  signToken,
  COOKIE_NAME,
  COOKIE_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
} from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

type AuthUser = {
  _id: { toString(): string };
  name: string;
  email: string;
  company?: string | null;
  get(path: "passwordHash"): string | null | undefined;
  get(path: "googleId"): string | null | undefined;
  get(path: "name"): string;
  get(path: "email"): string;
  get(path: "company"): string | null | undefined;
};

function toAuthUser(user: unknown): AuthUser {
  return user as AuthUser;
}

router.post("/auth/register", async (req, res) => {
  const { name, email, password, company } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required" });
    return;
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      res
        .status(409)
        .json({ error: "An account with this email already exists" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = toAuthUser(
      await User.create({ name, email, passwordHash, company }),
    );
    const token = signToken({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
    });
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      company: user.company,
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  try {
    const foundUser = await User.findOne({ email });
    const user = foundUser ? toAuthUser(foundUser) : null;
    if (!user || !user.get("passwordHash")) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(
      password,
      user.get("passwordHash") as string,
    );
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = signToken({
      userId: user._id.toString(),
      name: user.get("name"),
      email: user.get("email"),
    });
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    res.json({
      id: user._id.toString(),
      name: user.get("name"),
      email: user.get("email"),
      company: user.get("company"),
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, CLEAR_COOKIE_OPTIONS);
  res.json({ ok: true });
});

router.get("/auth/me", requireAuth, (req, res) => {
  const u = req.jwtUser!;
  res.json({ id: u.userId, name: u.name, email: u.email });
});

function getGoogleCallbackUrl(req: import("express").Request): string {
  if (process.env.GOOGLE_CALLBACK_URL) return process.env.GOOGLE_CALLBACK_URL;
  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (replitDomain) return `https://${replitDomain}/api/auth/google/callback`;
  const host = req.get("host") ?? "localhost:80";
  return `${req.protocol}://${host}/api/auth/google/callback`;
}

router.get("/auth/google", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.redirect("/login?error=google_not_configured");
    return;
  }
  const callbackUrl = getGoogleCallbackUrl(req);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/auth/google/callback", async (req, res) => {
  const { code, error } = req.query as Record<string, string>;
  if (error || !code) {
    res.redirect("/login?error=google_cancelled");
    return;
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.redirect("/login?error=google_not_configured");
    return;
  }
  try {
    const callbackUrl = getGoogleCallbackUrl(req);
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };
    if (!tokenData.access_token) {
      res.redirect("/login?error=google_failed");
      return;
    }
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );
    const gUser = (await userInfoRes.json()) as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };
    if (!gUser.email || !gUser.id) {
      res.redirect("/login?error=google_failed");
      return;
    }
    let user = (await User.findOne({
      $or: [{ googleId: gUser.id }, { email: gUser.email }],
    })) as AuthUser | null;
    if (user) {
      if (!user.get("googleId")) {
        await User.findByIdAndUpdate(user._id, {
          googleId: gUser.id,
          avatarUrl: gUser.picture ?? null,
        });
      }
    } else {
      user = toAuthUser(
        await User.create({
          name: gUser.name,
          email: gUser.email,
          googleId: gUser.id,
          avatarUrl: gUser.picture ?? null,
        }),
      );
    }
    const token = signToken({
      userId: user._id.toString(),
      name: user.get("name"),
      email: user.get("email"),
    });
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    res.redirect("/dashboard");
  } catch (err) {
    req.log.error({ err }, "Google OAuth callback error");
    res.redirect("/login?error=google_failed");
  }
});

export default router;
