import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const schema = z.object({
  acceptanceCriteriaId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  preconditions: z.string().trim().max(2000).default(""),
  steps: z.array(z.string().trim().min(1).max(500)).min(1).max(30),
  expectedResult: z.string().trim().min(3).max(2000),
});

export async function POST(request: Request, { params }: { params: Promise<{ requirementId: string }> }) {
  const { requirementId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Provide test steps and an expected result; limit to 30 steps." }, { status: 400 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: "Saving test cases requires configured PostgreSQL." }, { status: 503 });
  try {
    const requirement = await db.requirement.findUnique({ where: { id: requirementId }, select: { id: true } });
    if (!requirement) return NextResponse.json({ ok: false, error: "Requirement not found." }, { status: 404 });
    const testCase = await db.testCase.create({ data: { requirementId, ...parsed.data } });
    return NextResponse.json({ ok: true, testCase }, { status: 201 });
  } catch (error) {
    console.error("Test case could not be saved.", error);
    return NextResponse.json({ ok: false, error: "Test case could not be saved." }, { status: 503 });
  }
}
