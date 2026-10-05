import { NextResponse } from "next/server";
import { z } from "zod";
import { loadIntelligence } from "@/lib/server/intelligence-project";

const querySchema = z.object({
  projectId: z.string().min(1).max(100),
  q: z.string().trim().min(1).max(200),
  type: z.enum(["all", "requirement", "evidence", "conflict", "stakeholder", "brd"]).default("all"),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    projectId: url.searchParams.get("projectId"),
    q: url.searchParams.get("q"),
    type: url.searchParams.get("type") ?? "all",
  });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Provide projectId and a query between 1 and 200 characters." }, { status: 400 });
  try {
    const result = await loadIntelligence(parsed.data.projectId);
    if (!result) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    const query = parsed.data.q.toLowerCase();
    const { project } = result;
    const items = [
      ...project.requirements.map((item) => ({ id: item.id, type: "requirement", title: item.title, detail: item.summary, href: `/projects/${project.id}#requirements` })),
      ...project.evidence.map((item) => ({ id: item.id, type: "evidence", title: item.title, detail: item.excerpt, href: `/projects/${project.id}#requirements` })),
      ...project.conflicts.map((item) => ({ id: item.id, type: "conflict", title: item.title, detail: item.summary, href: `/projects/${project.id}#conflicts` })),
      ...result.intelligence.stakeholders.map((item) => ({ id: item.name, type: "stakeholder", title: item.name, detail: `${item.requirements} requirement(s) · ${item.conflicts} conflict(s)`, href: `/projects/${project.id}/stakeholders` })),
      ...project.brdSections.map((item) => ({ id: item.id, type: "brd", title: item.title, detail: item.content, href: `/projects/${project.id}` })),
    ].filter((item) => (parsed.data.type === "all" || item.type === parsed.data.type) && `${item.title} ${item.detail}`.toLowerCase().includes(query)).slice(0, 30);
    return NextResponse.json({ ok: true, projectId: project.id, query: parsed.data.q, results: items, total: items.length });
  } catch (error) {
    console.error("Project-scoped search failed.", error);
    return NextResponse.json({ ok: false, error: "Search is unavailable." }, { status: 503 });
  }
}
