import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { scoreRequirementQuality } from "@/lib/intelligence";

export const runtime = "nodejs";
const schema = z.object({ suggestion: z.string().trim().max(2000).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ requirementId: string }> }) {
  const { requirementId } = await params;
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: "Saving a quality review requires configured PostgreSQL." }, { status: 503 });
  let body: unknown = {};
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Quality suggestion is too long." }, { status: 400 });
  try {
    const requirement = await db.requirement.findUnique({ where: { id: requirementId }, include: { evidence: true } });
    if (!requirement) return NextResponse.json({ ok: false, error: "Requirement not found." }, { status: 404 });
    const score = scoreRequirementQuality({
      id: requirement.id, title: requirement.title, category: requirement.category, owner: requirement.owner,
      status: requirement.status === "approved" || requirement.status === "validated" || requirement.status === "draft" ? requirement.status : "review",
      confidence: Math.round(requirement.confidence * 100), summary: requirement.summary, rationale: requirement.rationale,
      evidenceIds: requirement.evidence.map((item) => item.id),
    }, requirement.evidence.map((item) => ({
      id: item.id, title: item.title, type: "document", source: item.source, confidence: Math.round(item.confidence * 100), excerpt: item.excerpt,
    })));
    const quality = await db.requirementQuality.create({ data: { requirementId, overall: score.overall, dimensions: score.dimensions, suggestion: parsed.data.suggestion } });
    return NextResponse.json({ ok: true, quality, originalPreserved: true }, { status: 201 });
  } catch (error) {
    console.error("Requirement quality review failed.", error);
    return NextResponse.json({ ok: false, error: "Quality review could not be saved." }, { status: 503 });
  }
}
