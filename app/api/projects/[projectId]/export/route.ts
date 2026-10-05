import { NextResponse } from "next/server";
import { projectDetail } from "@/lib/mock-data";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let project: unknown;

  if (!process.env.DATABASE_URL) {
    if (projectId !== projectDetail.id) return NextResponse.json({ ok: false, error: "Project not found in demo mode." }, { status: 404 });
    project = projectDetail;
  } else {
    try {
      project = await db.project.findUnique({
        where: { id: projectId },
        include: {
          requirements: { include: { evidence: true } },
          conflicts: true,
          evidence: true,
          sources: { select: { filename: true, type: true, status: true, createdAt: true } },
          versions: true,
          impact: true,
          brdSections: { orderBy: { position: "asc" } },
        },
      });
      if (!project) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    } catch (error) {
      console.error("BRD export failed.", error);
      return NextResponse.json({ ok: false, error: "Project export is unavailable. Check database connectivity." }, { status: 503 });
    }
  }

  const safeProjectId = projectId.replace(/[^a-zA-Z0-9-]/g, "");
  const filename = `${safeProjectId}-brd.json`;
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), project }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
