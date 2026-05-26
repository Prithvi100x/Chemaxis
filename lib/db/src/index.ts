import mongoose from "mongoose";
import { User } from "./models/User.js";
import { Report } from "./models/Report.js";
import { Purchase } from "./models/Purchase.js";
import { GeneratedReport } from "./models/GeneratedReport.js";

export { User, Report, Purchase, GeneratedReport };

export async function connectDB(): Promise<void> {
  let uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI must be set.");

  if (!uri.includes("/chemaxis")) {
    if (uri.includes("/?")) {
      uri = uri.replace("/?", "/chemaxis?");
    } else if (uri.endsWith("/")) {
      uri = uri + "chemaxis";
    } else {
      uri = uri + "/chemaxis";
    }
  }

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 30000,
  });
}
