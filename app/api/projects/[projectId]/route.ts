import { NextResponse } from "next/server";
import { projectDetail } from "@/lib/mock-data";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!process.env.DATABASE_URL) {
    if (projectId === projectDetail.id) return NextResponse.json({ ok: true, mode: "demo", project: projectDetail });
    return NextResponse.json({ ok: false, error: "Project not found in demo mode. Configure PostgreSQL to load saved projects." }, { status: 404 });
  }

  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        requirements: { include: { evidence: true }, orderBy: { createdAt: "asc" } },
        conflicts: true,
        evidence: true,
        sources: { orderBy: { createdAt: "desc" } },
        versions: { orderBy: { timestamp: "desc" } },
        impact: true,
        brdSections: { orderBy: { position: "asc" } },
      },
    });
    if (!project) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });

    const evidence = project.evidence.map((item) => ({
      id: item.id, title: item.title, type: item.type, source: item.source, confidence: Math.round(item.confidence * 100), excerpt: item.excerpt,
    }));
    const detail = {
      id: project.id, name: project.name, domain: project.domain, owner: project.owner, status: project.status,
      health: project.health, lastUpdated: project.updatedAt.toISOString(), sourceCount: project.sources.length,
      evidence,
      requirements: project.requirements.map((item) => ({
        id: item.id, title: item.title, category: item.category, owner: item.owner, status: item.status,
        confidence: Math.round(item.confidence * 100), summary: item.summary, rationale: item.rationale,
        evidenceIds: item.evidence.map((entry) => entry.id),
      })),
      conflicts: project.conflicts,
      versions: project.versions.map((item) => ({ id: item.id, label: item.label, summary: item.summary, timestamp: item.timestamp.toISOString(), impact: item.impact })),
      impact: project.impact,
      stakeholders: Array.from(new Set(project.requirements.map((item) => item.owner))),
      businessRules: [],
      brdSections: project.brdSections.map((section) => ({
        id: section.id, title: section.title, description: section.description, content: section.content,
      })),
      pipeline: [],
    };
    return NextResponse.json({ ok: true, mode: "database", project: detail });
  } catch (error) {
    console.error("Unable to load project from the configured database.", error);
    return NextResponse.json({ ok: false, error: "Project storage is unavailable. Check DATABASE_URL and database migrations." }, { status: 503 });
  }
}
