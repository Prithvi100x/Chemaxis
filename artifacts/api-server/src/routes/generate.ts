import { Router } from "express";
import mongoose from "mongoose";
import { Report, GeneratedReport } from "@workspace/db";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPEN_ROUTERR;
  if (!apiKey) throw new Error("OPEN_ROUTER API key is not set");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://chemaxis.app",
      "X-Title": "ChemAxis",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-maverick",
      max_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

router.post("/reports/:id/generate", requireAuth, async (req, res) => {
  const reportId = String(req.params.id);
  const userId = req.jwtUser!.userId;
  const { targetLanguage = "en", customNotes = "" } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const report = await Report.findById(reportId);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const gen = await GeneratedReport.create({
    userId, reportId, targetLanguage, customNotes, status: "processing",
  });

  res.json({ id: gen._id.toString(), status: "processing" });

  try {
    const langLabel: Record<string, string> = { en: "English", zh: "Chinese", ar: "Arabic", de: "German", fr: "French" };
    const targetLangName = langLabel[targetLanguage] ?? targetLanguage;

    const systemPrompt = `You are a professional chemical industry analyst who creates detailed market intelligence reports.
Your reports are clear, structured, and actionable. Use plain business language — avoid overly technical jargon.
Always respond in ${targetLangName}.`;

    const sampleData = report.get("sampleContent") ?? {};
    const userPrompt = `Generate a complete market intelligence report for: "${report.get("title")}"

Category: ${report.get("category")}
Description: ${report.get("description")}
${customNotes ? `Client's specific focus areas: ${customNotes}` : ""}

Create a well-structured report with these sections:
1. Executive Summary (3-4 sentences, key takeaways)
2. Market Overview (current market size, growth trends, key drivers)
3. Supply & Demand Analysis (production volumes, demand drivers, imbalances)
4. Price Trends (recent pricing, forecast range, factors affecting price)
5. Key Players & Market Share (top 5 companies, their roles)
6. Regional Breakdown (Asia-Pacific, Europe, North America, Middle East)
7. Risks & Opportunities (3 risks, 3 opportunities)
8. Outlook & Recommendations (12-month forecast, actionable advice)

Context data: ${JSON.stringify(sampleData)}

Write the full report in ${targetLangName}. Be specific with numbers and percentages where possible.`;

    const content = await callOpenRouter(systemPrompt, userPrompt);
    const sections = parseReportSections(content);

    await GeneratedReport.findByIdAndUpdate(gen._id, {
      status: "done",
      content: { raw: content, sections, generatedAt: new Date().toISOString(), targetLanguage, reportTitle: report.get("title") },
    });
  } catch (err) {
    req.log.error({ err }, "Generate report error");
    await GeneratedReport.findByIdAndUpdate(gen._id, { status: "error" });
  }
});

router.get("/generated/:id", requireAuth, async (req, res) => {
  const genId = String(req.params.id);
  const userId = req.jwtUser!.userId;

  if (!mongoose.Types.ObjectId.isValid(genId)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  try {
    const gen = await GeneratedReport.findOne({ _id: genId, userId });
    if (!gen) { res.status(404).json({ error: "Not found" }); return; }
    res.json(gen.toJSON());
  } catch (err) {
    req.log.error({ err }, "Get generated error");
    res.status(500).json({ error: "Failed to fetch generated report" });
  }
});

router.get("/my-reports", requireAuth, async (req, res) => {
  const userId = req.jwtUser!.userId;
  try {
    const gens = await GeneratedReport.find({ userId })
      .populate("reportId", "title category")
      .sort({ createdAt: 1 });

    res.json(gens.map(g => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reportDoc = g.reportId as any;
      const isPopulated = reportDoc && typeof reportDoc === "object" && "_id" in reportDoc;
      return {
        id: g._id.toString(),
        reportId: isPopulated ? reportDoc._id?.toString() : reportDoc?.toString(),
        status: g.get("status"),
        targetLanguage: g.get("targetLanguage"),
        customNotes: g.get("customNotes"),
        createdAt: g.get("createdAt"),
        reportTitle: isPopulated ? (reportDoc.title ?? null) : null,
        reportCategory: isPopulated ? (reportDoc.category ?? null) : null,
        content: g.get("content"),
      };
    }));
  } catch (err) {
    req.log.error({ err }, "My reports error");
    res.status(500).json({ error: "Failed to fetch your reports" });
  }
});

function parseReportSections(raw: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionNames = [
    "Executive Summary", "Market Overview", "Supply & Demand", "Price Trends",
    "Key Players", "Regional Breakdown", "Risks & Opportunities", "Outlook",
  ];
  for (let i = 0; i < sectionNames.length; i++) {
    const name = sectionNames[i];
    const next = sectionNames[i + 1];
    const startMatch = raw.match(new RegExp(`(?:^|\\n).*${name.replace("&", "[&＆]")}[:\\s]*\\n`, "i"));
    if (!startMatch) continue;
    const start = (startMatch.index ?? 0) + startMatch[0].length;
    let end = raw.length;
    if (next) {
      const endMatch = raw.substring(start).match(new RegExp(`(?:^|\\n).*${next.replace("&", "[&＆]")}[:\\s]*\\n`, "i"));
      if (endMatch) end = start + (endMatch.index ?? raw.length - start);
    }
    sections[name] = raw.substring(start, end).trim();
  }
  if (Object.keys(sections).length === 0) sections["Full Report"] = raw;
  return sections;
}

export default router;
