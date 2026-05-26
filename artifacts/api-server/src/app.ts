import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(jwtMiddleware);

app.use("/api", router);

export default app;
