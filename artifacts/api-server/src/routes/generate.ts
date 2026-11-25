import { Router } from "express";
import mongoose from "mongoose";
import { Report, GeneratedReport } from "@workspace/db";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";
const MAX_RETRIES = 2;
const MIN_VALID_SECTIONS = 3;

interface GenerationUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  modelVersion?: string;
  promptFeedback?: { blockReason?: string };
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  signal?: AbortSignal,
): Promise<{ content: string; usage: GenerationUsage; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      signal,
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          { role: "user", parts: [{ text: userPrompt }] },
        ],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.3,
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const data = await res.json() as GeminiResponse;
  const content = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!content) {
    const blockReason = data.promptFeedback?.blockReason;
    throw new Error(
      `Gemini response did not include generated text${blockReason ? ` (${blockReason})` : ""}`,
    );
  }

  return {
    content,
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount,
      completion_tokens: data.usageMetadata?.candidatesTokenCount,
      total_tokens: data.usageMetadata?.totalTokenCount,
    },
    model: data.modelVersion ?? model,
  };
}

function validateOutput(content: string): boolean {
  const sections = parseReportSections(content);
  const sectionCount = Object.keys(sections).length;
  const wordCount = content.split(/\s+/).length;
  return sectionCount >= MIN_VALID_SECTIONS && wordCount >= 400;
}

async function generateWithRetry(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ content: string; usage: GenerationUsage; model: string; retryCount: number }> {
  let lastError: Error | null = null;
  let retryCount = 0;

  const attempts = [
    { model: PRIMARY_MODEL, delayMs: 0 },
    { model: PRIMARY_MODEL, delayMs: 1500 },
    { model: FALLBACK_MODEL, delayMs: 0 },
  ];

  for (let i = 0; i <= MAX_RETRIES; i++) {
    const attempt = attempts[i];
    if (!attempt) break;

    if (attempt.delayMs > 0) {
      await new Promise(r => setTimeout(r, attempt.delayMs));
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90_000);

      const result = await callGemini(systemPrompt, userPrompt, attempt.model, controller.signal);
      clearTimeout(timeout);

      if (!validateOutput(result.content)) {
        retryCount++;
        lastError = new Error(`Output validation failed: only ${Object.keys(parseReportSections(result.content)).length} sections, ${result.content.split(/\s+/).length} words`);
        continue;
      }

      return { ...result, retryCount };
    } catch (err) {
      retryCount++;
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("All generation attempts failed");
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

  const startMs = Date.now();

  try {
    const langLabel: Record<string, string> = { en: "English", zh: "Chinese", ar: "Arabic", de: "German", fr: "French" };
    const targetLangName = langLabel[targetLanguage] ?? targetLanguage;

    const systemPrompt = `You are a senior chemical industry analyst with 15+ years of experience producing market intelligence reports for Fortune 500 companies.

Your reports are authoritative, data-driven, and actionable. You cite realistic market figures, price ranges, and growth rates grounded in industry knowledge up to your training cutoff.

STRICT FORMATTING RULES:
- Use exactly these section headers (with the number prefix): "1. Executive Summary", "2. Market Overview", "3. Supply & Demand Analysis", "4. Price Trends", "5. Key Players & Market Share", "6. Regional Breakdown", "7. Risks & Opportunities", "8. Outlook & Recommendations"
- Each section must have at least 3 substantive paragraphs or bullet points
- Include specific numbers, percentages, and USD price figures wherever possible
- Do NOT use placeholder text like "X%" or "[data unavailable]"
- Always respond entirely in ${targetLangName}`;

    const sampleData = report.get("sampleContent") ?? {};
    const userPrompt = `Generate a complete professional market intelligence report for: "${report.get("title")}"

Category: ${report.get("category")}
Description: ${report.get("description")}
${customNotes ? `Client focus areas: ${customNotes}` : ""}
Source context data: ${JSON.stringify(sampleData)}

Deliver all 8 sections in full. Be specific with numbers — include market size in USD billions, price ranges per tonne or kg, year-over-year growth rates, and top company market share percentages. Write in ${targetLangName}.`;

    const { content, usage, model: modelUsed, retryCount } = await generateWithRetry(systemPrompt, userPrompt);
    const generationMs = Date.now() - startMs;
    const sections = parseReportSections(content);

    await GeneratedReport.findByIdAndUpdate(gen._id, {
      status: "done",
      content: {
        raw: content,
        sections,
        generatedAt: new Date().toISOString(),
        targetLanguage,
        reportTitle: report.get("title"),
      },
      metrics: {
        generationMs,
        promptTokens: usage?.prompt_tokens ?? null,
        completionTokens: usage?.completion_tokens ?? null,
        totalTokens: usage?.total_tokens ?? null,
        retryCount,
        modelUsed,
      },
    });
  } catch (err) {
    const generationMs = Date.now() - startMs;
    req.log.error({ err, generationMs }, "Generate report error");
    await GeneratedReport.findByIdAndUpdate(gen._id, {
      status: "error",
      metrics: { generationMs },
    });
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
      .sort({ createdAt: -1 });

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
        metrics: g.get("metrics"),
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
