import { NextResponse } from "next/server";
import { z } from "zod";
import { loadIntelligence } from "@/lib/server/intelligence-project";

export const runtime = "nodejs";
const schema = z.object({
  action: z.enum(["review_requirement", "find_missing", "find_contradictions", "unsupported_claims", "stakeholder_gaps", "summarize_changes", "analyze_risk"]),
  requirementId: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Select a supported evidence review action." }, { status: 400 });
  try {
    const result = await loadIntelligence(projectId);
    if (!result) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    const project = result.project;
    const risks = result.intelligence.risk;
    let answer: string;
    if (parsed.data.action === "find_contradictions") {
      answer = project.conflicts.length
        ? project.conflicts.map((item) => `${item.title}: ${item.summary} Evidence references: ${project.evidence.filter((e) => item.requirements.some((id) => project.requirements.find((r) => r.id === id)?.evidenceIds.includes(e.id))).map((e) => e.source).join(", ") || "none linked"}.`).join(" ")
        : "No conflicts are recorded.";
    } else if (parsed.data.action === "unsupported_claims") {
      const items = project.requirements.filter((item) => !item.evidenceIds.length);
      answer = items.length ? `${items.length} requirement(s) have no evidence: ${items.map((item) => item.title).join("; ")}.` : "All current requirements have at least one linked evidence item.";
    } else if (parsed.data.action === "stakeholder_gaps") {
      const unassigned = project.requirements.filter((item) => !item.owner || item.owner === "Unassigned");
      answer = unassigned.length ? `${unassigned.length} requirement(s) need an owner: ${unassigned.map((item) => item.title).join("; ")}.` : `${result.intelligence.stakeholders.length} named owner profile(s) are represented. Confirm approver authority with project stakeholders.`;
    } else if (parsed.data.action === "analyze_risk") {
      const flagged = risks.filter((item) => item.level !== "LOW");
      answer = flagged.length ? flagged.map((risk) => `${project.requirements.find((item) => item.id === risk.id)?.title}: ${risk.level} (${risk.score}/100). ${risk.recommendation}`).join(" ") : "No elevated risks were flagged by deterministic checks.";
    } else if (parsed.data.action === "review_requirement") {
      const item = project.requirements.find((requirement) => requirement.id === parsed.data.requirementId);
      if (!item) return NextResponse.json({ ok: false, error: "Requirement not found in this project." }, { status: 404 });
      const linked = project.evidence.filter((evidence) => item.evidenceIds.includes(evidence.id));
      answer = `${item.title} has ${item.confidence}% confidence and ${linked.length} evidence link(s). ${item.rationale} Sources: ${linked.map((e) => e.source).join(", ") || "none"}.`;
    } else if (parsed.data.action === "find_missing") {
      answer = `The current ledger has ${project.requirements.length} requirements across ${new Set(project.requirements.map((item) => item.category)).size} categories. This system cannot determine omitted business scope without source material; add interview notes or policy documents for review.`;
    } else if (parsed.data.action === "summarize_changes") {
      answer = `${project.versions[0]?.summary ?? "No version summary is recorded."} ${project.versions[0]?.impact ?? ""}`;
    } else {
      answer = "Review completed using project records. No private chain-of-thought is available.";
    }
    return NextResponse.json({
      ok: true,
      mode: "evidence_rules",
      action: parsed.data.action,
      answer,
      evidence: project.evidence.filter((item) => answer.toLowerCase().includes(item.source.toLowerCase())).map((item) => ({ id: item.id, source: item.source, excerpt: item.excerpt })),
      disclaimer: "Concise, deterministic review of stored project records; verify decisions with the source owner.",
    });
  } catch (error) {
    console.error("Evidence review could not be completed.", error);
    return NextResponse.json({ ok: false, error: "Evidence review is unavailable." }, { status: 503 });
  }
}
