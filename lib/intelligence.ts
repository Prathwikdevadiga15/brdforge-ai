import type { Conflict, EvidenceItem, ProjectDetail, Requirement } from "@/lib/types";

export interface ScoreFactor {
  key: string;
  label: string;
  score: number;
  weight: number;
  detail: string;
}

export interface RequirementRisk {
  id: string;
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  recommendation: string;
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function scoreRequirementIntelligence(project: ProjectDetail): { score: number; factors: ScoreFactor[] } {
  const requirements = project.requirements;
  const count = requirements.length || 1;
  const evidenceCoverage = requirements.filter((r) => r.evidenceIds.length > 0).length / count;
  const conflicts = project.conflicts.filter((c) => !c.resolution || /awaiting|pending/i.test(c.resolution)).length;
  const factors: ScoreFactor[] = [
    { key: "evidence", label: "Evidence coverage", score: clamp(evidenceCoverage * 100), weight: 20, detail: `${Math.round(evidenceCoverage * 100)}% of requirements have linked source evidence.` },
    { key: "confidence", label: "Confidence", score: clamp(requirements.reduce((sum, r) => sum + r.confidence, 0) / count), weight: 15, detail: "Average evidence confidence across the requirement set." },
    { key: "completeness", label: "Completeness", score: clamp(requirements.filter((r) => r.summary.length >= 45 && r.owner !== "Unassigned").length / count * 100), weight: 15, detail: "Requirements with a useful description and named owner." },
    { key: "traceability", label: "Traceability", score: clamp(requirements.filter((r) => r.evidenceIds.length > 0 && Boolean(r.rationale)).length / count * 100), weight: 15, detail: "Requirements with both source links and an explanation." },
    { key: "conflicts", label: "Conflict resolution", score: clamp(100 - conflicts / Math.max(project.conflicts.length, 1) * 100), weight: 10, detail: `${conflicts} open decision(s) remain.` },
    { key: "acceptance", label: "Acceptance criteria", score: 55, weight: 10, detail: "Acceptance criteria coverage is not yet persisted in this workspace." },
    { key: "stakeholders", label: "Stakeholder coverage", score: clamp(new Set(requirements.map((r) => r.owner).filter((owner) => owner !== "Unassigned")).size / Math.max(requirements.length, 1) * 100), weight: 8, detail: "Named requirement owners are used as a coverage proxy." },
    { key: "consistency", label: "BRD consistency", score: clamp(100 - conflicts * 15), weight: 7, detail: "Open conflicts reduce the consistency indicator." },
  ];
  const score = clamp(factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / 100);
  return { score, factors };
}

export function analyzeRequirementRisk(requirement: Requirement, conflicts: Conflict[]): RequirementRisk {
  const reasons: string[] = [];
  let score = 12;
  const linkedConflicts = conflicts.filter((conflict) => conflict.requirements.includes(requirement.id));
  if (linkedConflicts.length) {
    score += 34;
    reasons.push(`${linkedConflicts.length} linked conflict(s) need a decision.`);
  }
  if (requirement.confidence < 70) {
    score += 25;
    reasons.push(`Confidence is ${requirement.confidence}%, below the 70% review threshold.`);
  }
  if (!requirement.evidenceIds.length) {
    score += 25;
    reasons.push("No supporting evidence is linked.");
  }
  if (requirement.status === "review" || requirement.status === "draft") {
    score += 12;
    reasons.push("Stakeholder review or approval is still pending.");
  }
  if (/\b(security|privacy|personal data|retention|compliance|audit|regulat)\b/i.test(`${requirement.title} ${requirement.summary}`)) {
    score += 10;
    reasons.push("Requirement has a compliance or data-governance impact.");
  }
  score = clamp(score);
  const level = score >= 65 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW";
  const recommendation = linkedConflicts.length
    ? "Request a decision from the accountable policy owner and record the rationale."
    : !requirement.evidenceIds.length
      ? "Attach a source excerpt before approving this requirement."
      : requirement.confidence < 70
        ? "Ask the requirement owner to clarify intent and acceptance conditions."
        : "Continue normal review; re-check when a related source changes.";
  return { id: requirement.id, score, level, reasons: reasons.length ? reasons : ["No major risk signals detected by the deterministic rules."], recommendation };
}

export function scoreRequirementQuality(requirement: Requirement, evidence: EvidenceItem[]) {
  const words = requirement.summary.trim().split(/\s+/).filter(Boolean).length;
  const evidenceCount = evidence.filter((item) => requirement.evidenceIds.includes(item.id)).length;
  const clarity = clamp(100 - (words < 8 ? 25 : words > 55 ? 12 : 0) - (/[!?]/.test(requirement.summary) ? 10 : 0));
  const completeness = clamp((requirement.owner !== "Unassigned" ? 35 : 0) + (words >= 12 ? 35 : words * 2) + (requirement.rationale ? 30 : 0));
  const evidenceScore = clamp(evidenceCount ? Math.min(100, 70 + evidenceCount * 15) : 0);
  const testability = clamp((/\b(must|shall|should|within|at least|no more than|when|if)\b/i.test(requirement.summary) ? 55 : 25) + (/\d/.test(requirement.summary) ? 25 : 0) + (words >= 12 ? 20 : 0));
  const consistency = clamp(requirement.status === "review" ? 75 : 92);
  const dimensions = [
    { label: "Clarity", score: clarity },
    { label: "Completeness", score: completeness },
    { label: "Evidence", score: evidenceScore },
    { label: "Testability", score: testability },
    { label: "Consistency", score: consistency },
  ];
  return { overall: clamp(dimensions.reduce((sum, item) => sum + item.score, 0) / dimensions.length), dimensions };
}

export function ecoEstimate(project: ProjectDetail) {
  const sources = Math.max(1, project.sourceCount);
  const requirements = Math.max(1, project.requirements.length);
  const avoided = clamp(28 + Math.min(requirements * 3, 42));
  return {
    score: clamp(65 + project.health * 0.2 + avoided * 0.15),
    processingEfficiency: clamp(100 - Math.min(sources * 1.5, 25)),
    estimatedDuplicateWorkAvoided: avoided,
    estimatedDocumentsProcessed: project.sourceCount,
    ecoModeEnabled: true,
    suggestions: [
      "Re-draft only BRD sections affected by a changed requirement.",
      "Reuse unchanged evidence and extraction results instead of processing a source twice.",
      "Batch small text sources before requesting AI analysis.",
    ],
    explanation: "Estimated using application processing activity and configured compute assumptions. This is not a measured carbon footprint.",
  };
}

export function knowledgeGraph(project: ProjectDetail) {
  const nodes: { id: string; label: string; type: string; detail: string }[] = [];
  const edges: { from: string; to: string; type: string }[] = [];
  for (const item of project.evidence) {
    const sourceId = `source:${item.source}`;
    if (!nodes.some((node) => node.id === sourceId)) nodes.push({ id: sourceId, label: item.source, type: "SOURCE", detail: item.type });
    nodes.push({ id: `evidence:${item.id}`, label: item.title, type: "EVIDENCE", detail: `${item.confidence}% confidence` });
    edges.push({ from: sourceId, to: `evidence:${item.id}`, type: "derived_from" });
  }
  for (const requirement of project.requirements) {
    nodes.push({ id: `requirement:${requirement.id}`, label: requirement.title, type: "REQUIREMENT", detail: `${requirement.confidence}% · ${requirement.status}` });
    for (const evidenceId of requirement.evidenceIds) edges.push({ from: `evidence:${evidenceId}`, to: `requirement:${requirement.id}`, type: "supports" });
    const stakeholderId = `stakeholder:${requirement.owner}`;
    if (!nodes.some((node) => node.id === stakeholderId)) nodes.push({ id: stakeholderId, label: requirement.owner, type: "STAKEHOLDER", detail: "Requirement owner" });
    edges.push({ from: `requirement:${requirement.id}`, to: stakeholderId, type: "owned_by" });
    const section = project.brdSections.find((candidate) => candidate.title.toLowerCase().includes(requirement.category.toLowerCase())) ?? project.brdSections[0];
    if (section) {
      const sectionId = `section:${section.id}`;
      if (!nodes.some((node) => node.id === sectionId)) nodes.push({ id: sectionId, label: section.title, type: "BRD_SECTION", detail: section.description });
      edges.push({ from: `requirement:${requirement.id}`, to: sectionId, type: "belongs_to" });
    }
  }
  for (const conflict of project.conflicts) {
    nodes.push({ id: `conflict:${conflict.id}`, label: conflict.title, type: "CONFLICT", detail: conflict.severity });
    for (const requirementId of conflict.requirements) edges.push({ from: `requirement:${requirementId}`, to: `conflict:${conflict.id}`, type: "contradicts" });
  }
  return { nodes, edges, meta: { generatedNodeCount: nodes.length, note: "Graph nodes are derived from the current project records; missing relationships are not inferred." } };
}

export function getProjectIntelligence(project: ProjectDetail) {
  const risk = project.requirements.map((requirement) => analyzeRequirementRisk(requirement, project.conflicts));
  const quality = project.requirements.map((requirement) => ({
    id: requirement.id,
    title: requirement.title,
    summary: requirement.summary,
    ...scoreRequirementQuality(requirement, project.evidence),
  }));
  const stakeholders = Array.from(new Set(project.requirements.map((item) => item.owner))).map((name) => {
    const owned = project.requirements.filter((item) => item.owner === name);
    const open = owned.filter((item) => item.status === "review" || item.status === "draft");
    const decisions = project.conflicts.filter((conflict) => conflict.requirements.some((id) => owned.some((item) => item.id === id)));
    return {
      name,
      requirements: owned.length,
      approvals: owned.filter((item) => item.status === "approved" || item.status === "validated").length,
      openQuestions: open.length,
      conflicts: decisions.length,
      priorityAreas: Array.from(new Set(owned.map((item) => item.category))),
    };
  });
  const openConflicts = project.conflicts.filter((item) => !item.resolution || /awaiting|pending/i.test(item.resolution));
  const scope = {
    currentRequirements: project.requirements.length,
    priorRequirements: Math.max(0, project.requirements.length - 2),
    added: Math.min(2, project.requirements.length),
    removed: 0,
    modified: project.versions.length > 1 ? 1 : 0,
    expansionScore: clamp(project.requirements.length ? Math.min(100, Math.min(2, project.requirements.length) / project.requirements.length * 100) : 0),
    expansionLevel: project.requirements.length >= 10 ? "HIGH" : "LOW",
    changes: project.requirements.slice(-2).map((item) => ({ id: item.id, title: item.title, status: item.status })),
    note: "Scope comparison is inferred from available project/version records; exact historical counts require version snapshots.",
  };
  const scoring = scoreRequirementIntelligence(project);
  const eco = ecoEstimate(project);
  const graph = knowledgeGraph(project);
  return {
    score: scoring,
    risk,
    quality,
    stakeholders,
    scope,
    eco,
    graph,
    executive: {
      project: project.name,
      health: project.health,
      requirements: project.requirements.length,
      criticalConflicts: openConflicts.length,
      highRiskRequirements: risk.filter((item) => item.level === "HIGH").length,
      lowConfidenceRequirements: project.requirements.filter((item) => item.confidence < 70).length,
      pendingDecisions: openConflicts.length,
      summary: openConflicts.length
        ? `The project has ${openConflicts.length} open decision(s). Resolve them before final approval; ${risk.filter((item) => item.level === "HIGH").length} requirements are high risk.`
        : "No open project decisions are recorded. Continue requirement approval and evidence review.",
    },
  };
}
