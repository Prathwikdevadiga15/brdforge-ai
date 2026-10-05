import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateRequirementSchema, validationMessage } from "@/lib/server/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string; requirementId: string }> }) {
  const { projectId, requirementId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = updateRequirementSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: validationMessage(parsed.error) }, { status: 400 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: "Requirement review requires configured PostgreSQL." }, { status: 503 });

  try {
    const requirement = await db.$transaction(async (tx) => {
      const result = await tx.requirement.updateMany({
        where: { id: requirementId, projectId },
        data: { status: parsed.data.status },
      });
      if (!result.count) return null;
      const updated = await tx.requirement.findUniqueOrThrow({
        where: { id: requirementId },
        select: { id: true, status: true, updatedAt: true },
      });
      await tx.auditEvent.create({
        data: {
          projectId,
          action: "REQUIREMENT_STATUS_UPDATED",
          entity: "requirement",
          entityId: requirementId,
          metadata: { status: parsed.data.status },
        },
      });
      return updated;
    });
    if (!requirement) return NextResponse.json({ ok: false, error: "Requirement not found in this project." }, { status: 404 });
    return NextResponse.json({ ok: true, requirement });
  } catch (error) {
    console.error("Requirement review update failed.", error);
    return NextResponse.json({ ok: false, error: "Requirement status could not be saved." }, { status: 503 });
  }
}
