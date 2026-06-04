import app from "../../api-server/src/app.js";
import { connectDB } from "../../../lib/db/src/index.js";

type ServerlessRequest = { url?: string };
type ExpressServer = {
  handle(request: ServerlessRequest, response: unknown): void;
};

let dbReady: Promise<void> | null = null;

function ensureDB(): Promise<void> {
  dbReady ??= connectDB();
  return dbReady;
}

const expressServer = app as unknown as ExpressServer;

export default async function handler(
  req: ServerlessRequest,
  res: unknown,
): Promise<void> {
  await ensureDB();

  if (typeof req.url === "string" && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
  }

  expressServer.handle(req, res);
}
