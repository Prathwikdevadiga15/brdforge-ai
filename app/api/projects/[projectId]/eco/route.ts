import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { loadIntelligence } from "@/lib/server/intelligence-project";

export const runtime = "nodejs";
const analyzeSchema = z.object({ ecoModeEnabled: z.boolean().default(true) });

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const result = await loadIntelligence(projectId);
    if (!result) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    return NextResponse.json({ ok: true, mode: process.env.DATABASE_URL ? "database" : "demo", eco: result.intelligence.eco });
  } catch (error) {
    console.error("Unable to load eco metrics.", error);
    return NextResponse.json({ ok: false, error: "Eco metrics are unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "ecoModeEnabled must be a boolean." }, { status: 400 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: "Eco analysis can be previewed in demo mode, but saving metrics requires PostgreSQL." }, { status: 503 });
  try {
    const result = await loadIntelligence(projectId);
    if (!result) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    const eco = result.intelligence.eco;
    const [metric] = await db.$transaction([
      db.ecoMetric.create({
        data: {
          projectId,
          score: eco.score,
          efficiency: eco.processingEfficiency,
          estimatedSavingsPercent: eco.estimatedDuplicateWorkAvoided,
          assumptions: { explanation: eco.explanation, ecoModeEnabled: parsed.data.ecoModeEnabled },
        },
      }),
      db.ecoEvent.create({
        data: { projectId, kind: "analysis", detail: eco.explanation, estimatedUnits: eco.estimatedDocumentsProcessed },
      }),
    ]);
    return NextResponse.json({ ok: true, metric, ecoModeEnabled: parsed.data.ecoModeEnabled });
  } catch (error) {
    console.error("Eco analysis could not be saved.", error);
    return NextResponse.json({ ok: false, error: "Eco analysis could not be saved." }, { status: 503 });
  }
}
