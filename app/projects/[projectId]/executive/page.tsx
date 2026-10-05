import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadIntelligence } from "@/lib/server/intelligence-project";

export default async function ExecutivePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const result = await loadIntelligence(projectId);
  if (!result) notFound();
  const executive = result.intelligence.executive;
  return <div className="space-y-6">
    <header className="rounded-3xl bg-slate-950 p-7 text-white"><p className="text-xs font-semibold tracking-[.18em] text-violet-300">EXECUTIVE DECISION CENTER</p><h1 className="mt-2 text-3xl font-semibold">{result.project.name}</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">{executive.summary}</p><p className="mt-3 text-[10px] text-slate-400">Summary is calculated from recorded project data; it is not a substitute for a stakeholder decision.</p></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ["BRD health", `${executive.health}%`], ["Requirements", executive.requirements], ["Open decisions", executive.pendingDecisions], ["High risk", executive.highRiskRequirements],
    ].map(([label, value]) => <Card key={label}><CardContent><p className="text-xs text-slate-500">{label}</p><strong className="mt-2 block text-3xl">{value}</strong></CardContent></Card>)}</div>
    <div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle><span className="flex items-center gap-2"><AlertTriangle size={17} className="text-amber-600" /> Decisions needing attention</span></CardTitle></CardHeader><CardContent className="space-y-3">{result.project.conflicts.map((conflict) => <div key={conflict.id} className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20"><strong className="text-sm">{conflict.title}</strong><p className="mt-1 text-xs text-slate-500">{conflict.summary}</p></div>)}{!result.project.conflicts.length && <p className="text-sm text-slate-500">No recorded conflicts.</p>}</CardContent></Card><Card><CardHeader><CardTitle><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-600" /> Review readiness</span></CardTitle></CardHeader><CardContent><p className="text-sm text-slate-600 dark:text-slate-300">{executive.lowConfidenceRequirements} requirement(s) are below 70% confidence. {executive.highRiskRequirements} are flagged by deterministic risk checks.</p><Link href={`/projects/${projectId}/intelligence`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-300">Open full intelligence analysis <ArrowRight size={14} /></Link></CardContent></Card></div>
  </div>;
}
