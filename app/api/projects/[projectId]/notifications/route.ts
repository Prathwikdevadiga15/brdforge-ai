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
      notifications: [
        { id: "demo-notice-1", kind: "CONFLICT", title: "New approval SLA conflict", detail: "24-hour and 48-hour targets disagree.", href: "/projects/atlas-ops#conflicts" },
        { id: "demo-notice-2", kind: "REVIEW", title: "Low-confidence requirement needs review", detail: "Review source evidence before approval.", href: "/projects/atlas-ops#requirements" },
      ],
    });
  }
  try {
    const notifications = await db.notification.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json({ ok: true, mode: "database", notifications });
  } catch (error) {
    console.error("Notifications could not be loaded.", error);
    return NextResponse.json({ ok: false, error: "Notifications are unavailable." }, { status: 503 });
  }
}
