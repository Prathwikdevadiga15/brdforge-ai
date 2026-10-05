import { db } from "@/lib/db";
import { projectDetail } from "@/lib/mock-data";
import type { Conflict, EvidenceItem, ImpactItem, ProjectDetail, RequirementStatus, VersionEntry } from "@/lib/types";
import { getProjectIntelligence } from "@/lib/intelligence";

const statuses = new Set<RequirementStatus>(["draft", "validated", "review", "approved"]);
const evidenceKinds = new Set<EvidenceItem["type"]>(["meeting", "email", "policy", "document", "screenshot", "transcript"]);

export async function loadIntelligence(projectId: string) {
  let project: ProjectDetail;
  if (!process.env.DATABASE_URL) {
    if (projectId !== projectDetail.id) return null;
    project = projectDetail;
  } else {
    const record = await db.project.findUnique({
      where: { id: projectId },
      include: {
        requirements: { include: { evidence: true }, orderBy: { createdAt: "asc" } },
        conflicts: true,
        evidence: true,
        sources: true,
        versions: { orderBy: { timestamp: "desc" } },
        impact: true,
        brdSections: { orderBy: { position: "asc" } },
      },
    });
    if (!record) return null;
    const evidence: EvidenceItem[] = record.evidence.map((item) => ({
      id: item.id,
      title: item.title,
      type: evidenceKinds.has(item.type as EvidenceItem["type"]) ? item.type as EvidenceItem["type"] : "document",
      source: item.source,
      confidence: Math.round(item.confidence * 100),
      excerpt: item.excerpt,
    }));
    const conflicts: Conflict[] = record.conflicts.map((item) => ({
      id: item.id,
      title: item.title,
      severity: item.severity === "critical" || item.severity === "high" || item.severity === "low" ? item.severity : "medium",
      summary: item.summary,
      requirements: item.requirements,
      resolution: item.resolution,
    }));
    const versions: VersionEntry[] = record.versions.map((item) => ({
      id: item.id,
      label: item.label,
      summary: item.summary,
      timestamp: item.timestamp.toISOString(),
      impact: item.impact,
    }));
    const impact: ImpactItem[] = record.impact.map((item) => ({
      id: item.id,
      section: item.section,
      effect: item.effect,
      risk: item.risk === "high" || item.risk === "low" ? item.risk : "medium",
      owner: item.owner,
    }));
    project = {
      id: record.id,
      name: record.name,
      domain: record.domain,
      owner: record.owner,
      status: record.status,
      health: record.health,
      lastUpdated: record.updatedAt.toISOString(),
      sourceCount: record.sources.length,
      evidence,
      requirements: record.requirements.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        owner: item.owner,
        status: statuses.has(item.status as RequirementStatus) ? item.status as RequirementStatus : "review",
        confidence: Math.round(item.confidence * 100),
        summary: item.summary,
        rationale: item.rationale,
        evidenceIds: item.evidence.map((entry) => entry.id),
      })),
      conflicts,
      versions,
      impact,
      stakeholders: Array.from(new Set(record.requirements.map((item) => item.owner))),
      businessRules: [],
      brdSections: record.brdSections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        content: section.content,
      })),
      pipeline: [],
    };
  }
  return { project, intelligence: getProjectIntelligence(project) };
}
