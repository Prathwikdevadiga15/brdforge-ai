import { NextResponse } from "next/server";
import { loadIntelligence } from "@/lib/server/intelligence-project";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const result = await loadIntelligence(projectId);
    if (!result) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    return NextResponse.json({ ok: true, scope: result.intelligence.scope });
  } catch (error) {
    console.error("Scope analysis could not be loaded.", error);
    return NextResponse.json({ ok: false, error: "Scope analysis is unavailable." }, { status: 503 });
  }
}
