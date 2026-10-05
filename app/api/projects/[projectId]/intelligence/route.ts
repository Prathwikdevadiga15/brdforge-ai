import { NextResponse } from "next/server";
import { loadIntelligence } from "@/lib/server/intelligence-project";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const result = await loadIntelligence(projectId);
    if (!result) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    return NextResponse.json({ ok: true, mode: process.env.DATABASE_URL ? "database" : "demo", ...result.intelligence });
  } catch (error) {
    console.error("Unable to calculate project intelligence.", error);
    return NextResponse.json({ ok: false, error: "Project intelligence is unavailable." }, { status: 503 });
  }
}
