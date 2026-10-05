import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Download, FileText, GitBranch, ShieldCheck } from "lucide-react";

import { db } from "@/lib/db";
import { ConflictReview } from "@/components/conflict-review";
import { RequirementReview } from "@/components/requirement-review";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readProjectDetail } from "@/lib/mock-data";
import type { EvidenceType, ProjectDetail, RequirementStatus } from "@/lib/types";

const requirementStatuses = new Set<RequirementStatus>(["draft", "validated", "review", "approved"]);
const evidenceTypes = new Set<EvidenceType>(["meeting", "email", "policy", "document", "screenshot", "transcript"]);
const riskLevels = new Set(["low", "medium", "high"]);

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let project: ProjectDetail;
  if (!process.env.DATABASE_URL) {
    if (projectId !== "atlas-ops") notFound();
    project = readProjectDetail(projectId);
  } else {
    const row = await db.project.findUnique({
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
    if (!row) notFound();
    const evidence = row.evidence.map((item) => ({
      id: item.id,
      title: item.title,
      type: evidenceTypes.has(item.type as EvidenceType) ? item.type as EvidenceType : "document",
      source: item.source,
      confidence: Math.round(item.confidence * 100),
      excerpt: item.excerpt,
    }));
    project = {
      id: row.id, name: row.name, domain: row.domain, owner: row.owner, status: row.status,
      health: row.health, lastUpdated: row.updatedAt.toISOString(), sourceCount: row.sources.length,
      evidence,
      requirements: row.requirements.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        owner: item.owner,
        status: requirementStatuses.has(item.status as RequirementStatus) ? item.status as RequirementStatus : "review",
        confidence: Math.round(item.confidence * 100),
        summary: item.summary,
        rationale: item.rationale,
        evidenceIds: item.evidence.map((entry) => entry.id),
      })),
      conflicts: row.conflicts.map((item) => ({
        id: item.id,
        title: item.title,
        severity: riskLevels.has(item.severity) ? item.severity as "low" | "medium" | "high" : "medium",
        summary: item.summary,
        requirements: item.requirements,
        resolution: item.resolution,
      })),
      versions: row.versions.map((item) => ({
        id: item.id, label: item.label, summary: item.summary, timestamp: item.timestamp.toISOString(), impact: item.impact,
      })),
      impact: row.impact.map((item) => ({
        id: item.id, section: item.section, effect: item.effect,
        risk: riskLevels.has(item.risk) ? item.risk as "low" | "medium" | "high" : "medium", owner: item.owner,
      })),
      stakeholders: Array.from(new Set(row.requirements.map((item) => item.owner))),
      businessRules: [],
      brdSections: row.brdSections.map((section) => ({
        id: section.id, title: section.title, description: section.description, content: section.content,
      })),
      pipeline: [],
    };
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge className="mb-3">Project workspace</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{project.name}</h1>
        </div>
        <a href={`/api/projects/${encodeURIComponent(project.id)}/export`} className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900">
          <Download className="h-4 w-4" /> Export BRD JSON
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Sources", value: project.sourceCount, icon: FileText },
          { label: "Requirements", value: project.requirements.length, icon: CheckCircle2 },
          { label: "Conflicts", value: project.conflicts.length, icon: AlertTriangle },
          { label: "Versions", value: project.versions.length, icon: GitBranch },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                <Icon className="h-4 w-4 text-violet-500" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card id="requirements">
          <CardHeader>
            <CardTitle>Requirement ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.requirements.map((requirement) => (
                <div key={requirement.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{requirement.title}</p>
                      <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{requirement.category}</p>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                      {requirement.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{requirement.summary}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Confidence {requirement.confidence}%</span>
                    <span>Owner: {requirement.owner}</span>
                  </div>
                  <details className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                    <summary className="cursor-pointer text-xs font-medium text-violet-700 dark:text-violet-300">Evidence and rationale ({requirement.evidenceIds.length})</summary>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{requirement.rationale}</p>
                    <div className="mt-2 space-y-2">
                      {project.evidence.filter((item) => requirement.evidenceIds.includes(item.id)).map((item) => (
                        <blockquote key={item.id} className="rounded-lg border-l-2 border-violet-400 bg-white p-3 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                          <p>&ldquo;{item.excerpt}&rdquo;</p>
                          <cite className="mt-1 block not-italic text-[10px] text-slate-400">{item.source} · {item.confidence}% evidence confidence</cite>
                        </blockquote>
                      ))}
                    </div>
                  </details>
                  {process.env.DATABASE_URL && (
                    <RequirementReview projectId={project.id} requirementId={requirement.id} status={requirement.status} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business rules</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                {project.businessRules.map((rule) => (
                  <li key={rule} className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stakeholders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.stakeholders.map((person) => (
                  <span key={person} className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {person}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card id="conflicts">
        <CardHeader><CardTitle>Conflicts and decisions</CardTitle></CardHeader>
        <CardContent>
          {project.conflicts.length ? (
            <div className="space-y-3">
              {project.conflicts.map((conflict) => (
                <ConflictReview key={conflict.id} projectId={project.id} conflict={conflict} databaseEnabled={Boolean(process.env.DATABASE_URL)} />
              ))}
            </div>
          ) : <p className="text-sm text-slate-500">No conflicts have been identified.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>BRD sections</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {project.brdSections.map((section) => (
              <article key={section.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">{section.title}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{section.description}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{section.content || "No approved content yet."}</p>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
