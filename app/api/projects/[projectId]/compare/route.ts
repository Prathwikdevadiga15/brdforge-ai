import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { projectDetail } from "@/lib/mock-data";

const schema = z.object({
  sourceA: z.string().trim().min(1).max(120),
  sourceB: z.string().trim().min(1).max(120),
  textA: z.string().max(100_000),
  textB: z.string().max(100_000),
});

function lines(text: string) {
  return Array.from(new Set(text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)));
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Provide two text sources of at most 100 KB each." }, { status: 400 });
  if (!process.env.DATABASE_URL && projectId !== projectDetail.id) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
  const a = lines(parsed.data.textA);
  const b = lines(parsed.data.textB);
  const added = b.filter((line) => !a.includes(line));
  const removed = a.filter((line) => !b.includes(line));
  const result = { sourceA: parsed.data.sourceA, sourceB: parsed.data.sourceB, added, removed, modified: [], note: "Exact line comparison; semantically similar text is not interpreted by this comparison." };
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: true, mode: "demo_preview", comparison: result });
  try {
    const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    const saved = await db.documentComparison.create({
      data: {
        projectId,
        sourceA: parsed.data.sourceA,
        sourceB: parsed.data.sourceB,
        added,
        removed,
        modified: [],
        affectedRequirementIds: [],
      },
    });
    return NextResponse.json({ ok: true, mode: "database", comparison: result, saved }, { status: 201 });
  } catch (error) {
    console.error("Document comparison could not be saved.", error);
    return NextResponse.json({ ok: false, error: "Document comparison is unavailable." }, { status: 503 });
  }
}
