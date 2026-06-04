import mongoose from "mongoose";
import { normalizeMongoDocument, stringifyObjectIdField } from "./serialize.js";

const generatedReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
    },
    targetLanguage: { type: String, default: "en" },
    customNotes: { type: String, default: null },
    status: { type: String, default: "pending" },
    content: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        stringifyObjectIdField(ret, "reportId");
        stringifyObjectIdField(ret, "userId");
        return normalizeMongoDocument(ret);
      },
    },
  },
);

export const GeneratedReport = mongoose.model(
  "GeneratedReport",
  generatedReportSchema,
);
