import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadIntelligence } from "@/lib/server/intelligence-project";

export default async function StakeholderPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const result = await loadIntelligence(projectId);
  if (!result) notFound();
  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-600">STAKEHOLDER INTELLIGENCE</p><h1 className="mt-2 text-3xl font-semibold">{result.project.name}</h1><p className="mt-2 text-sm text-slate-500">Profiles are derived from the requirement owners currently recorded in this project.</p></header>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {result.intelligence.stakeholders.map((person) => <Card key={person.name}>
        <CardHeader><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><Users size={18} /></span><div><CardTitle>{person.name}</CardTitle><p className="mt-1 text-xs text-slate-400">Requirement owner</p></div></div></CardHeader>
        <CardContent><div className="grid grid-cols-3 gap-2 text-center">{[["Requirements", person.requirements], ["Approved", person.approvals], ["Open", person.openQuestions]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950"><strong className="block text-lg">{value}</strong><span className="text-[9px] text-slate-400">{label}</span></div>)}</div><p className="mt-3 text-xs text-slate-500">Priority areas: {person.priorityAreas.join(", ") || "Not recorded"}</p><p className="mt-1 text-xs text-slate-500">Related conflicts: {person.conflicts}</p></CardContent>
      </Card>)}
    </section>
  </div>;
}
