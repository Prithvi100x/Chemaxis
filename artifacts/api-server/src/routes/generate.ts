import { Router } from "express";
import mongoose from "mongoose";
import { Report, GeneratedReport } from "@workspace/db";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const PRIMARY_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";
const MAX_RETRIES = 2;
const MIN_VISUAL_SECTIONS = 5;

const VISUALIZATION_TYPES = [
  "bar", "line", "area", "donut", "waterfall", "heatmap", "radar",
  "scatter", "bubble", "funnel", "timeline", "flow",
] as const;

type VisualizationType = (typeof VISUALIZATION_TYPES)[number];

interface VisualDatum {
  label: string;
  value: number;
  secondaryValue?: number;
  size?: number;
}

interface VisualChart {
  type: VisualizationType;
  title: string;
  unit: string;
  annotation: string;
  data: VisualDatum[];
}

interface VisualSection {
  title: string;
  summary: string;
  keyInsight: string;
  chart: VisualChart;
}

interface VisualKpi {
  label: string;
  value: string;
  context: string;
  trend: "up" | "down" | "flat";
}

interface VisualReport {
  executiveSummary: string;
  kpis: VisualKpi[];
  sections: VisualSection[];
}

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
          responseMimeType: "application/json",
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function readNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseVisualReport(raw: string): VisualReport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The model did not return valid report JSON");
  }

  if (!isRecord(parsed)) throw new Error("The model returned an invalid report structure");

  const kpis = Array.isArray(parsed.kpis)
    ? parsed.kpis.flatMap((item): VisualKpi[] => {
      if (!isRecord(item)) return [];
      const trend = item.trend === "up" || item.trend === "down" || item.trend === "flat" ? item.trend : "flat";
      const label = readText(item.label);
      const value = readText(item.value);
      if (!label || !value) return [];
      return [{ label, value, context: readText(item.context), trend }];
    })
    : [];

  const sections = Array.isArray(parsed.sections)
    ? parsed.sections.flatMap((item): VisualSection[] => {
      if (!isRecord(item) || !isRecord(item.chart)) return [];
      const chartData = Array.isArray(item.chart.data)
        ? item.chart.data.flatMap((point): VisualDatum[] => {
          if (!isRecord(point)) return [];
          const label = readText(point.label);
          const value = readNumber(point.value);
          if (!label || value === null) return [];
          const secondaryValue = readNumber(point.secondaryValue);
          const size = readNumber(point.size);
          return [{ label, value, ...(secondaryValue === null ? {} : { secondaryValue }), ...(size === null ? {} : { size }) }];
        })
        : [];
      const chartType = VISUALIZATION_TYPES.includes(item.chart.type as VisualizationType)
        ? item.chart.type as VisualizationType
        : "bar";
      const title = readText(item.title);
      const chartTitle = readText(item.chart.title);
      if (!title || !chartTitle || chartData.length < 2) return [];
      return [{
        title,
        summary: readText(item.summary),
        keyInsight: readText(item.keyInsight),
        chart: {
          type: chartType,
          title: chartTitle,
          unit: readText(item.chart.unit),
          annotation: readText(item.chart.annotation),
          data: chartData,
        },
      }];
    })
    : [];

  const executiveSummary = readText(parsed.executiveSummary);
  if (!executiveSummary || kpis.length < 3 || sections.length < MIN_VISUAL_SECTIONS) {
    throw new Error("The visual report is incomplete");
  }

  return { executiveSummary, kpis, sections };
}

async function generateWithRetry(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ content: string; usage: GenerationUsage; model: string; retryCount: number; visualReport: VisualReport }> {
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

      return { ...result, visualReport: parseVisualReport(result.content), retryCount };
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

    const systemPrompt = `You are a senior chemical-industry analyst and information-design director. Create a comprehensive visual-intelligence report in ${targetLangName}.

The report must communicate primarily through accurate charts, diagrams, KPI cards, and concise visual explanations rather than long paragraphs. Select chart types that fit the supplied data—do not force a chart merely to appear diverse. Use at least five distinct visualization types across the report, selected from: bar, line, area, donut, waterfall, heatmap, radar, scatter, bubble, funnel, timeline, and flow. A flow chart can represent a process flow, Sankey-style relationship, or hierarchy when the data supports it.

Only use figures supported by the supplied source context or clearly label them as estimates, scenarios, or forecasts. Never invent a citation or present an estimate as observed fact.

Return valid JSON only, with no Markdown fences or commentary, matching this exact shape:
{
  "executiveSummary": "Concise 60–100 word overview",
  "kpis": [{ "label": "Metric", "value": "Formatted value", "context": "What it means", "trend": "up|down|flat" }],
  "sections": [{
    "title": "Section title",
    "summary": "Concise 50–90 word explanation of the visual",
    "keyInsight": "One decision-ready conclusion",
    "chart": {
      "type": "bar|line|area|donut|waterfall|heatmap|radar|scatter|bubble|funnel|timeline|flow",
      "title": "Chart title",
      "unit": "USD/MT, %, index, or another clear unit",
      "annotation": "A precise observation about the chart",
      "data": [{ "label": "Category or period", "value": 123, "secondaryValue": 45, "size": 20 }]
    }
  }]
}

Provide 4–6 KPI cards and exactly 6 sections. Every chart needs 3–8 numerical data points except timeline and flow charts, which may have 2–6 ordered stages. Use secondaryValue only for scatter, bubble, or comparison visuals, and size only for bubble visuals.`;

    const sampleData = report.get("sampleContent") ?? {};
    const userPrompt = `Create the visual intelligence report for: "${report.get("title")}"

Category: ${report.get("category")}
Description: ${report.get("description")}
${customNotes ? `Client focus areas: ${customNotes}` : ""}
Source context data: ${JSON.stringify(sampleData)}

Use a modern executive-dashboard style. Include meaningful labels, units, annotations, exact supplied values, percentages where valid, key trends, anomalies, relationships, and decision-ready takeaways. Keep the language ${targetLangName}.`;

    const { content, usage, model: modelUsed, retryCount, visualReport } = await generateWithRetry(systemPrompt, userPrompt);
    const generationMs = Date.now() - startMs;
    const sections = Object.fromEntries(visualReport.sections.map((section) => [section.title, section.summary]));

    await GeneratedReport.findByIdAndUpdate(gen._id, {
      status: "done",
      content: {
        raw: content,
        sections,
        visualReport,
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

export default router;
