import OpenAI from "openai";

export interface ExtractedRequirement {
  title: string;
  category: string;
  summary: string;
  confidence: number;
}

const resultSchema = {
  type: "object",
  additionalProperties: false,
  required: ["requirements"],
  properties: {
    requirements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "category", "summary", "confidence"],
        properties: {
          title: { type: "string" },
          category: { type: "string" },
          summary: { type: "string" },
          confidence: { type: "number" },
        },
      },
    },
  },
} as const;

function heuristicExtract(text: string): ExtractedRequirement[] {
  return text
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line.length >= 25 && /\b(must|shall|required|should|needs? to|will)\b/i.test(line))
    .slice(0, 12)
    .map((summary) => ({
      title: summary.length > 76 ? `${summary.slice(0, 73).trimEnd()}...` : summary,
      category: /\b(security|privacy|encrypt|access|audit|retention)\b/i.test(summary) ? "Governance" : "Functional",
      summary,
      confidence: 0.55,
    }));
}

export async function extractRequirements(text: string): Promise<{ requirements: ExtractedRequirement[]; mode: "ai" | "heuristic" }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { requirements: heuristicExtract(text), mode: "heuristic" };

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
    timeout: 20_000,
    maxRetries: 1,
  });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_schema", json_schema: { name: "requirements", strict: true, schema: resultSchema } },
    messages: [
      { role: "system", content: "Extract only explicit, testable business or system requirements. Do not invent requirements. Keep summaries faithful to the source. Confidence is an evidence-strength score from 0 to 1, not a probability." },
      { role: "user", content: text },
    ],
  });
  const content = response.choices[0]?.message.content;
  if (!content) throw new Error("The AI provider returned an empty extraction response.");
  const parsed = JSON.parse(content) as { requirements: ExtractedRequirement[] };
  return {
    requirements: parsed.requirements.slice(0, 25).map((item) => ({
      ...item,
      title: item.title.slice(0, 180),
      category: item.category.slice(0, 80),
      summary: item.summary.slice(0, 2000),
      confidence: Math.max(0, Math.min(1, item.confidence)),
    })),
    mode: "ai",
  };
}
