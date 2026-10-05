import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeRequirementRisk } from "@/lib/intelligence";

export const runtime = "nodejs";

async function calculate(requirementId: string) {
  const requirement = await db.requirement.findUnique({
    where: { id: requirementId },
    include: { evidence: true, project: { include: { conflicts: true } } },
  });
  if (!requirement) return null;
  const risk = analyzeRequirementRisk({
    id: requirement.id,
    title: requirement.title,
    category: requirement.category,
    owner: requirement.owner,
    status: requirement.status === "approved" || requirement.status === "validated" || requirement.status === "draft" ? requirement.status : "review",
    confidence: Math.round(requirement.confidence * 100),
    summary: requirement.summary,
    rationale: requirement.rationale,
    evidenceIds: requirement.evidence.map((item) => item.id),
  }, requirement.project.conflicts.map((item) => ({
    id: item.id, title: item.title, severity: item.severity === "high" || item.severity === "critical" || item.severity === "low" ? item.severity : "medium",
    summary: item.summary, requirements: item.requirements, resolution: item.resolution,
  })));
  return { risk, projectId: requirement.projectId };
}

export async function GET(_request: Request, { params }: { params: Promise<{ requirementId: string }> }) {
  const { requirementId } = await params;
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: "Risk persistence requires configured PostgreSQL." }, { status: 503 });
  try {
    const result = await calculate(requirementId);
    if (!result) return NextResponse.json({ ok: false, error: "Requirement not found." }, { status: 404 });
    const saved = await db.requirementRisk.findFirst({ where: { requirementId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ ok: true, risk: result.risk, saved });
  } catch (error) {
    console.error("Risk analysis could not be read.", error);
    return NextResponse.json({ ok: false, error: "Risk analysis is unavailable." }, { status: 503 });
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ requirementId: string }> }) {
  const { requirementId } = await params;
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: "Risk persistence requires configured PostgreSQL." }, { status: 503 });
  try {
    const result = await calculate(requirementId);
    if (!result) return NextResponse.json({ ok: false, error: "Requirement not found." }, { status: 404 });
    const saved = await db.requirementRisk.create({
      data: {
        requirementId,
        score: result.risk.score,
        level: result.risk.level,
        reasons: result.risk.reasons,
        recommendation: result.risk.recommendation,
      },
    });
    return NextResponse.json({ ok: true, risk: result.risk, saved }, { status: 201 });
  } catch (error) {
    console.error("Risk analysis could not be saved.", error);
    return NextResponse.json({ ok: false, error: "Risk analysis could not be saved." }, { status: 503 });
  }
}
