import express, { type Express } from "express";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";
import { jwtMiddleware } from "./middleware/auth.js";
import router from "./routes/index.js";
import "./types/session.js";

const app: Express = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(currentDir, "../../chemaxis/dist/public");

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
  if (raw)
    return raw
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  return null;
})();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (!allowedOrigins) {
        callback(null, true);
        return;
      }
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

if (process.env.NODE_ENV === "production" && existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

export default app;
