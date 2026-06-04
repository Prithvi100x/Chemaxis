import mongoose from "mongoose";
import { normalizeMongoDocument } from "./serialize.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, default: null },
    googleId: { type: String, default: null, sparse: true },
    avatarUrl: { type: String, default: null },
    company: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => normalizeMongoDocument(ret),
    },
  },
);

export const User = mongoose.model("User", userSchema);
