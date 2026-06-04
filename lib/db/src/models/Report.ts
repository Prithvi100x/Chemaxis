import mongoose from "mongoose";
import { normalizeMongoDocument } from "./serialize.js";

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    sourceLanguage: { type: String, default: "zh" },
    priceCents: { type: Number, required: true },
    tags: [String],
    pageCount: { type: Number, default: 20 },
    sampleContent: { type: mongoose.Schema.Types.Mixed, default: null },
    fullContent: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => normalizeMongoDocument(ret),
    },
  },
);

export const Report = mongoose.model("Report", reportSchema);
