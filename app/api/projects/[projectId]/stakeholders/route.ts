import { NextResponse } from "next/server";
import { loadIntelligence } from "@/lib/server/intelligence-project";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const result = await loadIntelligence(projectId);
    if (!result) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    return NextResponse.json({ ok: true, stakeholders: result.intelligence.stakeholders });
  } catch (error) {
    console.error("Stakeholders could not be loaded.", error);
    return NextResponse.json({ ok: false, error: "Stakeholder intelligence is unavailable." }, { status: 503 });
  }
}
