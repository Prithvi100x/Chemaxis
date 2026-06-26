import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
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

reportSchema.index({ category: 1, priceCents: 1 });
reportSchema.index({ tags: 1 });
reportSchema.index({ title: "text", description: "text", tags: "text" });

export const Report = mongoose.model("Report", reportSchema);
