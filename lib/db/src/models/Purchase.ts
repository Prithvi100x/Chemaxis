import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true },
    generatedReportId: { type: mongoose.Schema.Types.ObjectId, ref: "GeneratedReport", default: null },
    amountCents: { type: Number, required: true },
    status: { type: String, default: "completed" },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc: unknown, ret: Record<string, any>) => {
        ret["id"] = ret["_id"]?.toString();
        ret["reportId"] = ret["reportId"]?.toString();
        ret["userId"] = ret["userId"]?.toString();
        if (ret["generatedReportId"]) ret["generatedReportId"] = ret["generatedReportId"].toString();
        const r = ret as Record<string, unknown>;
        delete r["_id"];
        delete r["__v"];
        return ret;
      },
    },
  }
);

export const Purchase = mongoose.model("Purchase", purchaseSchema);
