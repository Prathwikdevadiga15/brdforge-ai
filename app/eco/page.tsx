import Link from "next/link";
import { ArrowRight, Leaf, Recycle, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectIntelligence } from "@/lib/intelligence";
import { projectDetail } from "@/lib/mock-data";

export default function EcoPage() {
  const eco = getProjectIntelligence(projectDetail).eco;
  return (
    <div className="space-y-7">
      <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-7 dark:border-emerald-900 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900">
        <Badge className="mb-4"><Leaf className="mr-1 inline h-3 w-3" /> ECO INTELLIGENCE · ESTIMATES</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Make every processing step count.</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Eco Mode favors incremental updates and avoids reprocessing unchanged sources. These are application-efficiency indicators—not measured carbon emissions.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Eco score" value={`${eco.score}/100`} icon={<Leaf className="h-4 w-4" />} />
          <Metric label="Processing efficiency" value={`${eco.processingEfficiency}%`} icon={<Zap className="h-4 w-4" />} />
          <Metric label="Estimated duplicate work avoided" value={`${eco.estimatedDuplicateWorkAvoided}%`} icon={<Recycle className="h-4 w-4" />} />
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader><CardTitle>Low-compute workflow suggestions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">{eco.suggestions.map((suggestion, index) => (
              <div key={suggestion} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">{index + 1}</span>
                <p className="text-sm text-slate-600 dark:text-slate-300">{suggestion}</p>
              </div>
            ))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Incremental processing</CardTitle><ShieldCheck className="h-5 w-5 text-emerald-600" /></CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-end justify-between"><span className="text-sm text-slate-500">New source documents in demo</span><strong className="text-2xl">{eco.estimatedDocumentsProcessed}</strong></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${eco.estimatedDuplicateWorkAvoided}%` }} /></div>
              <p className="text-xs leading-relaxed text-slate-500">{eco.explanation}</p>
              <Link href="/projects/atlas-ops" className="inline-flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-300">View project evidence <ArrowRight size={15} /></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"><div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">{icon}<span className="text-xs font-medium">{label}</span></div><strong className="mt-3 block text-3xl text-slate-900 dark:text-white">{value}</strong></div>;
}
