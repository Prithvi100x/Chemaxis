import mongoose from "mongoose";

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
      transform: (_doc: unknown, ret: Record<string, any>) => {
        ret["id"] = ret["_id"]?.toString();
        const r = ret as Record<string, unknown>;
        delete r["_id"];
        delete r["__v"];
        return ret;
      },
    },
  }
);

export const User = mongoose.model("User", userSchema);
