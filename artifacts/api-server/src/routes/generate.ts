import { Router } from "express";
import { db, reportsTable, generatedReportsTable, purchasesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/reports/:id/generate", requireAuth, async (req, res) => {
  const reportId = Number(req.params.id);
  const userId = req.session!.userId!;
  const { targetLanguage = "en", customNotes = "" } = req.body;

  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, reportId)).limit(1);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const [gen] = await db.insert(generatedReportsTable).values({
    userId,
    reportId,
    targetLanguage,
    customNotes,
    status: "processing",
  }).returning();

  res.json({ id: gen.id, status: "processing" });

  try {

    const langLabel: Record<string, string> = { en: "English", zh: "Chinese", ar: "Arabic", de: "German", fr: "French" };
    const targetLangName = langLabel[targetLanguage] ?? targetLanguage;

    const systemPrompt = `You are a professional chemical industry analyst who creates detailed market intelligence reports.
Your reports are clear, structured, and actionable. Use plain business language — avoid overly technical jargon.
Always respond in ${targetLangName}.`;

    const sampleData = report.sampleContent ?? {};
    const userPrompt = `Generate a complete market intelligence report for: "${report.title}"

Category: ${report.category}
Description: ${report.description}
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

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "";
    const sections = parseReportSections(content);

    await db.update(generatedReportsTable)
      .set({ status: "done", content: { raw: content, sections, generatedAt: new Date().toISOString(), targetLanguage, reportTitle: report.title } })
      .where(eq(generatedReportsTable.id, gen.id));
  } catch (err) {
    req.log.error({ err }, "Generate report error");
    await db.update(generatedReportsTable)
      .set({ status: "error" })
      .where(eq(generatedReportsTable.id, gen.id));
  }
});

router.get("/generated/:id", requireAuth, async (req, res) => {
  const genId = Number(req.params.id);
  const userId = req.session!.userId!;
  try {
    const [gen] = await db.select().from(generatedReportsTable)
      .where(and(eq(generatedReportsTable.id, genId), eq(generatedReportsTable.userId, userId)))
      .limit(1);
    if (!gen) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(gen);
  } catch (err) {
    req.log.error({ err }, "Get generated error");
    res.status(500).json({ error: "Failed to fetch generated report" });
  }
});

router.get("/my-reports", requireAuth, async (req, res) => {
  const userId = req.session!.userId!;
  try {
    const gens = await db.select({
      id: generatedReportsTable.id,
      reportId: generatedReportsTable.reportId,
      status: generatedReportsTable.status,
      targetLanguage: generatedReportsTable.targetLanguage,
      createdAt: generatedReportsTable.createdAt,
      reportTitle: reportsTable.title,
      reportCategory: reportsTable.category,
    })
    .from(generatedReportsTable)
    .leftJoin(reportsTable, eq(generatedReportsTable.reportId, reportsTable.id))
    .where(eq(generatedReportsTable.userId, userId))
    .orderBy(generatedReportsTable.createdAt);
    res.json(gens);
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
