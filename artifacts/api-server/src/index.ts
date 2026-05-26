import app from "./app.js";
import { logger } from "./lib/logger.js";
import { db, reportsTable } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const SEED_REPORTS = [
  {
    title: "China Benzene Market Report 2025",
    description: "Full analysis of China's benzene supply chain, import/export data, pricing trends, and a 12-month price forecast.",
    category: "Petrochemicals", sourceLanguage: "zh", priceCents: 4900, pageCount: 28,
    tags: ["benzene", "petrochemical", "China", "pricing"],
    sampleContent: { spotPrice: "$820/MT", change30d: "+4.2%", productionVolume: "18.4M MT/year", topProducers: ["Sinopec", "CNOOC", "Hengli Petrochemical"] },
  },
  {
    title: "Global Ethylene Glycol Supply Chain Report",
    description: "Covers MEG/EEG production capacity, downstream demand from polyester and PET, regional trade flows, and price outlook across 6 key markets.",
    category: "Specialty Chemicals", sourceLanguage: "zh", priceCents: 5900, pageCount: 34,
    tags: ["ethylene glycol", "MEG", "polyester", "PET"],
    sampleContent: { spotPrice: "$560/MT", change30d: "-1.8%", productionVolume: "36.2M MT/year", topProducers: ["SABIC", "Dow", "Reliance", "Sinopec"] },
  },
  {
    title: "Titanium Dioxide (TiO₂) Market Intelligence — Asia Pacific",
    description: "Demand from coatings, plastics, and paper industries. Covers ilmenite supply constraints, chloride vs. sulfate process trends, and top 5 producer profiles.",
    category: "Industrial Chemicals", sourceLanguage: "zh", priceCents: 4400, pageCount: 22,
    tags: ["TiO2", "titanium dioxide", "coatings", "pigment"],
    sampleContent: { spotPrice: "$2,800/MT", change30d: "+2.1%", marketSize: "$18.2B globally", topProducers: ["Chemours", "Tronox", "Venator", "Lomon Billions"] },
  },
  {
    title: "Methanol Price & Production Outlook — Q3 2025",
    description: "China's coal-to-methanol expansion, shipping route disruptions, seasonal demand spikes, and a detailed pricing model across 4 global hubs.",
    category: "Petrochemicals", sourceLanguage: "zh", priceCents: 3900, pageCount: 18,
    tags: ["methanol", "coal-to-chemicals", "shipping", "pricing"],
    sampleContent: { spotPrice: "$310/MT", change30d: "+6.5%", productionVolume: "120M MT/year", keyDrivers: ["Coal prices", "Natural gas parity", "MTO demand"] },
  },
  {
    title: "Polypropylene (PP) Demand Report — Southeast Asia",
    description: "Covers automotive, packaging, and consumer goods demand. Maps new PP capacity in Vietnam, Indonesia, and Thailand with impact on regional pricing.",
    category: "Polymers", sourceLanguage: "zh", priceCents: 4700, pageCount: 26,
    tags: ["polypropylene", "PP", "Southeast Asia", "packaging"],
    sampleContent: { spotPrice: "$970/MT", change30d: "-0.9%", marketSize: "$14.6B in SEA", topProducers: ["PTT", "SCG Chemicals", "Pertamina"] },
  },
  {
    title: "Sulfuric Acid Supply & Demand — India Market",
    description: "Fertilizer-driven demand, phosphate rock import links, environmental regulations on smelter by-product acid, and capacity expansion plans.",
    category: "Industrial Chemicals", sourceLanguage: "zh", priceCents: 3500, pageCount: 16,
    tags: ["sulfuric acid", "fertilizer", "India", "phosphate"],
    sampleContent: { spotPrice: "$85/MT", change30d: "+1.4%", productionVolume: "8.6M MT/year", majorConsumers: ["Fertilizer industry", "Steel processing", "Battery acid"] },
  },
];

async function seedReports() {
  try {
    const existing = await db.select({ id: reportsTable.id }).from(reportsTable).limit(1);
    if (existing.length > 0) return;
    await db.insert(reportsTable).values(SEED_REPORTS);
    logger.info("Seeded 6 reports");
  } catch (err) {
    logger.error({ err }, "Failed to seed reports");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
  await seedReports();
});
