import type { Conflict, EvidenceItem, ImpactItem, ProjectDetail, ProjectSummary, Requirement, VersionEntry } from "@/lib/types";

const evidence: EvidenceItem[] = [
  {
    id: "ev-01",
    title: "Board approval memo",
    type: "document",
    source: "Executive review pack",
    confidence: 96,
    excerpt:
      "The product must reduce policy-approval turnaround from 14 days to 5 days while preserving audit visibility.",
  },
  {
    id: "ev-02",
    title: "Ops workflow transcript",
    type: "transcript",
    source: "Regional operations sync",
    confidence: 91,
    excerpt:
      "Stakeholders repeatedly emphasized the need for exception handling during audit season and a single shared timeline.",
  },
  {
    id: "ev-03",
    title: "Data retention policy",
    type: "policy",
    source: "Compliance handbook",
    confidence: 98,
    excerpt:
      "Customer case files must retain evidence for 7 years and support export in PDF and DOCX formats.",
  },
  {
    id: "ev-04",
    title: "Customer interview notes",
    type: "meeting",
    source: "SMB customer interviews",
    confidence: 89,
    excerpt:
      "Users want to understand why a requirement changed and what downstream teams are impacted before sign-off.",
  },
  {
    id: "ev-05",
    title: "UI screenshot review",
    type: "screenshot",
    source: "Prototype review board",
    confidence: 88,
    excerpt:
      "A single BRD overview and version diff are visible as top-level tasks in the prototype experience.",
  },
];

const requirements: Requirement[] = [
  {
    id: "req-01",
    title: "Multi-source intake and normalization",
    category: "Ingestion",
    owner: "Product intelligence",
    status: "validated",
    confidence: 95,
    summary: "The system should ingest fragmented information from meeting notes, transcriptions, PDFs, screenshots, and spreadsheets into a normalized evidence set.",
    rationale: "This requirement is directly tied to the source intake workflow and contains strong recurring support from multiple operational interviews.",
    evidenceIds: ["ev-01", "ev-02"],
  },
  {
    id: "req-02",
    title: "Requirement extraction with confidence",
    category: "AI pipeline",
    owner: "AI platform",
    status: "review",
    confidence: 88,
    summary: "The platform should extract requirements and assign confidence scores based on evidence quality and cross-source alignment.",
    rationale: "Confidence scoring is a central concept in the target product and appears in both the product brief and the demo narrative.",
    evidenceIds: ["ev-02", "ev-05"],
  },
  {
    id: "req-03",
    title: "Conflict detection and reconciliation",
    category: "Decisioning",
    owner: "Business operations",
    status: "validated",
    confidence: 92,
    summary: "The system must reconcile duplicates and highlight contradictions across requirement clusters before BRD generation.",
    rationale: "This requirement underpins the reconciliation and conflict detection steps in the product lifecycle and is explicitly called out in the core principle.",
    evidenceIds: ["ev-01", "ev-04"],
  },
  {
    id: "req-04",
    title: "Explainable evidence traceability",
    category: "Governance",
    owner: "Compliance",
    status: "validated",
    confidence: 97,
    summary: "Every requirement should show the exact evidence used, explain why it was included, and provide a confidence indicator for review.",
    rationale: "Traceability and explainability are stated as central success criteria; the phrase is repeated across user guidance and design requirements.",
    evidenceIds: ["ev-03", "ev-04"],
  },
  {
    id: "req-05",
    title: "Living BRD versioning and diffing",
    category: "Document management",
    owner: "Product ops",
    status: "approved",
    confidence: 94,
    summary: "The BRD should evolve incrementally with version history, requirement lifecycle changes, and impacted downstream sections.",
    rationale: "The brief explicitly demands a living BRD, incremental updates, and version diffing, making this requirement highly evidential.",
    evidenceIds: ["ev-01", "ev-05"],
  },
  {
    id: "req-06",
    title: "Export to DOCX, PDF, and JSON",
    category: "Delivery",
    owner: "Customer success",
    status: "draft",
    confidence: 86,
    summary: "The final BRD should support export in human-readable and machine-readable formats for downstream review and archival.",
    rationale: "Export support is a direct requirement in the system requirements and aligns with auditable delivery workflows.",
    evidenceIds: ["ev-03", "ev-05"],
  },
];

const conflicts: Conflict[] = [
  {
    id: "conf-01",
    title: "Approval cadence mismatch",
    severity: "high",
    summary: "One stakeholder expects real-time approvals while another emphasizes governance gates and a slower review cycle.",
    requirements: ["req-03", "req-05"],
    resolution: "Use hybrid flow: fast-track approvals for low-risk changes and governance review for policy-sensitive changes.",
  },
  {
    id: "conf-02",
    title: "Evidence retention scope",
    severity: "medium",
    summary: "Data retention needs overlap with a requirement to minimize storage overhead and preserve evidence for audits.",
    requirements: ["req-04", "req-06"],
    resolution: "Store the core evidence bundle and keep export artifacts for archival while compressing secondary indexes.",
  },
];

const versions: VersionEntry[] = [
  {
    id: "v-01",
    label: "v1.2",
    summary: "Added policy-backed evidence and requirements validation checks.",
    timestamp: "2026-10-04T09:00:00Z",
    impact: "No downstream contract change; review required for operations alignment.",
  },
  {
    id: "v-02",
    label: "v1.1",
    summary: "Reconciled duplicate requirements from transcript and email sources.",
    timestamp: "2026-10-03T15:40:00Z",
    impact: "Updated finance workflow and release notes.",
  },
  {
    id: "v-03",
    label: "v1.0",
    summary: "Initial BRD generated from fragmented meeting and policy sources.",
    timestamp: "2026-10-02T11:15:00Z",
    impact: "Baselined deployment plan and evidence log.",
  },
];

const impact: ImpactItem[] = [
  {
    id: "imp-01",
    section: "Requirements intake",
    effect: "Small change in file classification rules could alter the confidence weighting of source documents.",
    risk: "medium",
    owner: "AI platform",
  },
  {
    id: "imp-02",
    section: "Conflict resolution",
    effect: "If approval gating logic changes, affected teams will need retraining and updated playbooks.",
    risk: "high",
    owner: "Business ops",
  },
  {
    id: "imp-03",
    section: "Export workflow",
    effect: "DOCX/PDF layout changes may influence downstream legal review and archival automation.",
    risk: "low",
    owner: "Customer success",
  },
];

export const projectSummaries: ProjectSummary[] = [
  {
    id: "atlas-ops",
    name: "Atlas Ops Hub",
    domain: "Operations intelligence",
    status: "In review",
    health: 84,
    lastUpdated: "2h ago",
    owner: "Nadia Shah",
  },
  {
    id: "northstar-we",
    name: "NorthStar Workforce",
    domain: "Workforce planning",
    status: "Validated",
    health: 92,
    lastUpdated: "1d ago",
    owner: "Daniel Wu",
  },
  {
    id: "finora-compliance",
    name: "Finora Compliance",
    domain: "Risk & compliance",
    status: "At risk",
    health: 67,
    lastUpdated: "4h ago",
    owner: "Alicia Moreno",
  },
];

export const projectDetail: ProjectDetail = {
  id: "atlas-ops",
  name: "Atlas Ops Hub",
  domain: "Operations intelligence",
  status: "In review",
  health: 84,
  lastUpdated: "2h ago",
  owner: "Nadia Shah",
  sourceCount: 14,
  requirements,
  conflicts,
  evidence,
  versions,
  impact,
  stakeholders: ["Product lead", "Ops manager", "Compliance analyst", "Customer success", "AI platform"],
  businessRules: [
    "All new requirements require evidence before entering validation.",
    "Conflicts above medium severity must be reviewed by the policy owner.",
    "BRD updates are incremental and preserve a versioned diff trail.",
  ],
  brdSections: [
    {
      id: "sec-01",
      title: "Objective and scope",
      description: "Defines the system outcome and operational scope.",
      content: "Atlas Ops Hub provides a requirement intelligence layer for fragmented business inputs, reconciling operational evidence into a validated living BRD with export-ready narratives and stakeholder-safe traceability.",
    },
    {
      id: "sec-02",
      title: "Data intake and quality",
      description: "Outline of intake modalities and quality controls.",
      content: "The intake layer captures meeting notes, PDFs, transcripts, screenshots, spreadsheets, and policies, normalizes them, and scores them by relevance, evidence quality, and conflict density.",
    },
    {
      id: "sec-03",
      title: "Human review and governance",
      description: "Describes reconciliation and required approvals.",
      content: "High-risk requirement conflicts are routed to a human reviewer, while validated records remain in a traceable lifecycle with impact analysis and versioned change tracking.",
    },
  ],
  pipeline: [
    { stage: "Ingestion", status: "Complete", detail: "14 sources ingested and normalized" },
    { stage: "Extraction", status: "In progress", detail: "24 candidate requirements scored" },
    { stage: "Reconciliation", status: "Queued", detail: "2 high-priority conflicts awaiting review" },
    { stage: "BRD drafting", status: "Ready", detail: "3 sections ready for review" },
  ],
};

export function resolveProjectById(projectId: string) {
  return projectSummaries.find((project) => project.id === projectId) ?? projectSummaries[0];
}

export function readProjectDetail(projectId: string) {
  return projectId === projectDetail.id ? projectDetail : projectDetail;
}
