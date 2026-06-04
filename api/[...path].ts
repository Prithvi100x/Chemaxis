import app from "../artifacts/api-server/src/app.js";
import { connectDB } from "../lib/db/src/index.js";

let dbReady: Promise<void> | null = null;

function ensureDB(): Promise<void> {
  dbReady ??= connectDB();
  return dbReady;
}

export default async function handler(req: any, res: any): Promise<void> {
  await ensureDB();

  if (typeof req.url === "string" && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
  }

  app(req, res);
}
