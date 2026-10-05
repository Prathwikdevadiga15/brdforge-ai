export type RequirementStatus = "draft" | "validated" | "review" | "approved";

export type EvidenceType = "meeting" | "email" | "policy" | "document" | "screenshot" | "transcript";

export interface EvidenceItem {
  id: string;
  title: string;
  type: EvidenceType;
  source: string;
  confidence: number;
  excerpt: string;
}

export interface Requirement {
  id: string;
  title: string;
  category: string;
  owner: string;
  status: RequirementStatus;
  confidence: number;
  summary: string;
  rationale: string;
  evidenceIds: string[];
}

export interface Conflict {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  summary: string;
  requirements: string[];
  resolution: string;
}

export interface VersionEntry {
  id: string;
  label: string;
  summary: string;
  timestamp: string;
  impact: string;
}

export interface ImpactItem {
  id: string;
  section: string;
  effect: string;
  risk: "low" | "medium" | "high";
  owner: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  domain: string;
  status: string;
  health: number;
  lastUpdated: string;
  owner: string;
}

export interface ProjectDetail extends ProjectSummary {
  sourceCount: number;
  requirements: Requirement[];
  conflicts: Conflict[];
  evidence: EvidenceItem[];
  versions: VersionEntry[];
  impact: ImpactItem[];
  stakeholders: string[];
  businessRules: string[];
  brdSections: Array<{
    id: string;
    title: string;
    description: string;
    content: string;
  }>;
  pipeline: Array<{
    stage: string;
    status: string;
    detail: string;
  }>;
}
