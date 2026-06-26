import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { logger } from "./lib/logger.js";
import { jwtMiddleware } from "./middleware/auth.js";
import router from "./routes/index.js";
import "./types/session.js";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

const allowedOrigins = (() => {
  const raw = process.env.ALLOWED_ORIGINS;
  if (raw) return raw.split(",").map((o) => o.trim()).filter(Boolean);
  return null;
})();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) { callback(null, true); return; }
      if (!allowedOrigins) { callback(null, true); return; }
      const allowed = allowedOrigins.some(
        (o) => o === origin || origin.endsWith(o.replace(/^https?:\/\//, "")),
      );
      callback(allowed ? null : new Error("CORS: origin not allowed"), allowed);
    },
    credentials: true,
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: () => process.env.NODE_ENV !== "production",
});

const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Report generation limit reached. Please try again in an hour." },
  skip: () => process.env.NODE_ENV !== "production",
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests." },
  skip: () => process.env.NODE_ENV !== "production",
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(jwtMiddleware);

app.use("/api", globalLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/reports/:id/generate", generateLimiter);

app.use("/api", router);

export default app;
