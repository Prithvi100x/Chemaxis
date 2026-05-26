import mongoose from "mongoose";
import { User } from "./models/User.js";
import { Report } from "./models/Report.js";
import { Purchase } from "./models/Purchase.js";
import { GeneratedReport } from "./models/GeneratedReport.js";

export { User, Report, Purchase, GeneratedReport };

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI must be set.");
  await mongoose.connect(uri);
}
