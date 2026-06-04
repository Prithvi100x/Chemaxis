import mongoose from "mongoose";
import { normalizeMongoDocument, stringifyObjectIdField } from "./serialize.js";

const purchaseSchema = new mongoose.Schema(
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
    generatedReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeneratedReport",
      default: null,
    },
    amountCents: { type: Number, required: true },
    status: { type: String, default: "completed" },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        stringifyObjectIdField(ret, "reportId");
        stringifyObjectIdField(ret, "userId");
        stringifyObjectIdField(ret, "generatedReportId");
        return normalizeMongoDocument(ret);
      },
    },
  },
);

export const Purchase = mongoose.model("Purchase", purchaseSchema);
