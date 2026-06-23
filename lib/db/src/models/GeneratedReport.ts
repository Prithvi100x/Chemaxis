import mongoose from "mongoose";

const generatedReportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true },
    targetLanguage: { type: String, default: "en" },
    customNotes: { type: String, default: null },
    status: { type: String, default: "pending" },
    content: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc: unknown, ret: Record<string, any>) => {
        ret["id"] = ret["_id"]?.toString();
        ret["reportId"] = ret["reportId"]?.toString();
        ret["userId"] = ret["userId"]?.toString();
        const r = ret as Record<string, unknown>;
        delete r["_id"];
        delete r["__v"];
        return ret;
      },
    },
  }
);

export const GeneratedReport = mongoose.model("GeneratedReport", generatedReportSchema);
