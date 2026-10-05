import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveConflictSchema, validationMessage } from "@/lib/server/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string; conflictId: string }> }) {
  const { projectId, conflictId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = resolveConflictSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: validationMessage(parsed.error) }, { status: 400 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: "Conflict decisions require configured PostgreSQL." }, { status: 503 });

  try {
    const result = await db.$transaction(async (tx) => {
      const updated = await tx.conflict.updateMany({
        where: { id: conflictId, projectId },
        data: { resolution: parsed.data.resolution },
      });
      if (!updated.count) return false;
      await tx.version.create({
        data: {
          projectId,
          label: `decision-${new Date().toISOString()}`,
          summary: `Resolved conflict ${conflictId}.`,
          impact: parsed.data.resolution,
        },
      });
      await tx.auditEvent.create({
        data: {
          projectId,
          action: "CONFLICT_RESOLVED",
          entity: "conflict",
          entityId: conflictId,
          metadata: { resolution: parsed.data.resolution },
        },
      });
      return true;
    });
    if (!result) return NextResponse.json({ ok: false, error: "Conflict not found in this project." }, { status: 404 });
    return NextResponse.json({ ok: true, conflictId, resolution: parsed.data.resolution });
  } catch (error) {
    console.error("Conflict resolution failed.", error);
    return NextResponse.json({ ok: false, error: "Conflict decision could not be saved." }, { status: 503 });
  }
}
