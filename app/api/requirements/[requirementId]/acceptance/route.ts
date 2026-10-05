import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({
  given: z.string().trim().min(3).max(1000),
  when: z.string().trim().min(3).max(1000),
  then: z.string().trim().min(3).max(1000),
  status: z.enum(["draft", "approved", "rejected"]).default("draft"),
});

export async function POST(request: Request, { params }: { params: Promise<{ requirementId: string }> }) {
  const { requirementId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Provide Given, When, and Then statements of 3 to 1000 characters." }, { status: 400 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: "Acceptance criteria can be previewed in demo mode but saving requires PostgreSQL." }, { status: 503 });
  try {
    const exists = await db.requirement.findUnique({ where: { id: requirementId }, select: { id: true } });
    if (!exists) return NextResponse.json({ ok: false, error: "Requirement not found." }, { status: 404 });
    const acceptance = await db.acceptanceCriteria.create({ data: { requirementId, ...parsed.data } });
    return NextResponse.json({ ok: true, acceptance }, { status: 201 });
  } catch (error) {
    console.error("Acceptance criteria could not be saved.", error);
    return NextResponse.json({ ok: false, error: "Acceptance criteria could not be saved." }, { status: 503 });
  }
}
