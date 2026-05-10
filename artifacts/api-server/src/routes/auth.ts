import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

const router = Router();

// ── Email / Password ──────────────────────────────────────────────────────────

router.post("/auth/register", async (req, res) => {
  const { name, email, password, company } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required" });
    return;
  }
  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(usersTable).values({ name, email, passwordHash, company }).returning();
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.save((saveErr) => {
      if (saveErr) req.log.error({ err: saveErr }, "Session save error");
      res.json({ id: user.id, name: user.name, email: user.email, company: user.company });
    });
    return;
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
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.save((saveErr) => {
      if (saveErr) req.log.error({ err: saveErr }, "Session save error");
      res.json({ id: user.id, name: user.name, email: user.email, company: user.company });
    });
    return;
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) req.log.error({ err }, "Logout error");
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ id: req.session.userId, name: req.session.userName, email: req.session.userEmail });
});

// ── Google OAuth2 ─────────────────────────────────────────────────────────────

function getGoogleCallbackUrl(req: import("express").Request): string {
  if (process.env.GOOGLE_CALLBACK_URL) return process.env.GOOGLE_CALLBACK_URL;
  // Auto-detect from Replit domain
  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (replitDomain) return `https://${replitDomain}/api/auth/google/callback`;
  // Fallback for local dev
  const host = req.get("host") ?? "localhost:80";
  const proto = req.protocol;
  return `${proto}://${host}/api/auth/google/callback`;
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

    // Exchange code for tokens
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
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      req.log.error({ tokenData }, "Google token exchange failed");
      res.redirect("/login?error=google_failed");
      return;
    }

    // Fetch Google user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const gUser = (await userInfoRes.json()) as {
      id: string; email: string; name: string; picture?: string;
    };
    if (!gUser.email || !gUser.id) {
      res.redirect("/login?error=google_failed");
      return;
    }

    // Find existing user by googleId or email, or create new
    let [user] = await db
      .select()
      .from(usersTable)
      .where(or(eq(usersTable.googleId, gUser.id), eq(usersTable.email, gUser.email)))
      .limit(1);

    if (user) {
      // Update googleId + avatarUrl if not yet linked
      if (!user.googleId) {
        await db
          .update(usersTable)
          .set({ googleId: gUser.id, avatarUrl: gUser.picture ?? null })
          .where(eq(usersTable.id, user.id));
      }
    } else {
      // Create new Google-only user
      [user] = await db
        .insert(usersTable)
        .values({
          name: gUser.name,
          email: gUser.email,
          googleId: gUser.id,
          avatarUrl: gUser.picture ?? null,
          passwordHash: null,
        })
        .returning();
    }

    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.save((saveErr) => {
      if (saveErr) req.log.error({ err: saveErr }, "Session save error after Google OAuth");
      res.redirect("/dashboard");
    });
  } catch (err) {
    req.log.error({ err }, "Google OAuth callback error");
    res.redirect("/login?error=google_failed");
  }
});

export default router;
