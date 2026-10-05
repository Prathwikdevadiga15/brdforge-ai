import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectDetail } from "@/lib/mock-data";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!process.env.DATABASE_URL) {
    if (projectId !== projectDetail.id) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    return NextResponse.json({
      ok: true,
      mode: "demo",
      activity: [
        { id: "demo-activity-1", kind: "CONFLICT_DETECTED", title: "Approval SLA mismatch detected", at: "2026-10-05T10:00:00.000Z" },
        { id: "demo-activity-2", kind: "BRD_VERSIONED", title: "BRD v1.2 is ready for review", at: "2026-10-05T09:30:00.000Z" },
      ],
    });
  }
  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        sources: { orderBy: { createdAt: "desc" }, take: 25 },
        requirements: { orderBy: { updatedAt: "desc" }, take: 25 },
        conflicts: true,
        versions: { orderBy: { timestamp: "desc" }, take: 25 },
        auditEvents: { orderBy: { createdAt: "desc" }, take: 25 },
        processingJobs: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { events: { orderBy: { createdAt: "asc" } } },
        },
      },
    });
    if (!project) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    const activity = [
      ...project.sources.map((item) => ({ id: item.id, kind: "SOURCE_UPLOADED", title: `Source received: ${item.filename}`, at: item.createdAt.toISOString() })),
      ...project.requirements.map((item) => ({ id: item.id, kind: "REQUIREMENT_UPDATED", title: `${item.title} · ${item.status}`, at: item.updatedAt.toISOString() })),
      ...project.conflicts.map((item) => ({ id: item.id, kind: "CONFLICT_RECORDED", title: item.title, at: project.updatedAt.toISOString() })),
      ...project.versions.map((item) => ({ id: item.id, kind: "VERSION_CREATED", title: `${item.label} · ${item.summary}`, at: item.timestamp.toISOString() })),
      ...project.auditEvents.map((item) => ({ id: item.id, kind: item.action, title: `${item.entity} · ${item.action.toLowerCase().replaceAll("_", " ")}`, at: item.createdAt.toISOString() })),
      ...project.processingJobs.map((job) => ({
        id: job.id,
        kind: "PROCESSING_JOB",
        title: `Source processing ${job.status} · ${job.events.length} recorded stage(s)`,
        at: (job.completedAt ?? job.createdAt).toISOString(),
      })),
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50);
    return NextResponse.json({ ok: true, mode: "database", activity });
  } catch (error) {
    console.error("Project activity could not be loaded.", error);
    return NextResponse.json({ ok: false, error: "Activity timeline is unavailable." }, { status: 503 });
  }
}
