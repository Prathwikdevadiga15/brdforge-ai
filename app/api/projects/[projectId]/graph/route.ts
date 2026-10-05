import { NextResponse } from "next/server";
import { loadIntelligence } from "@/lib/server/intelligence-project";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const result = await loadIntelligence(projectId);
    if (!result) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    return NextResponse.json({ ok: true, ...result.intelligence.graph });
  } catch (error) {
    console.error("Knowledge graph could not be loaded.", error);
    return NextResponse.json({ ok: false, error: "Knowledge graph is unavailable." }, { status: 503 });
  }
}
