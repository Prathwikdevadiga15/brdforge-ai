import { ArrowRight, FileText, Layers3, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const demoStages = [
  { title: "Fragmented sources", detail: "Docs, PDFs, policies, screenshots and transcript snippets." },
  { title: "AI understanding", detail: "Multimodal extraction and evidence scoring for every candidate requirement." },
  { title: "Conflict detection", detail: "Duplicates, contradictions, and governance gaps highlighted for humans." },
  { title: "Living BRD", detail: "Incremental requirement updates, version diffs, and export-ready documents." },
];

export default function DemoPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-violet-500/10 via-slate-50 to-cyan-500/10 p-8 dark:border-slate-700 dark:from-violet-500/20 dark:to-slate-900">
        <Badge className="mb-3">Product demo</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          From fragmented inputs to evidence-backed BRDs
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          BRDForge AI ingests mixed source content, reconciles contradictions, and produces explainable, versioned requirements you can trust.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button>Run demo</Button>
          <Button variant="outline">Download sample BRD</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Evidence coverage", value: "94%", icon: ShieldCheck }, { label: "Requirements extracted", value: "24", icon: Layers3 }, { label: "Conflicts detected", value: "02", icon: FileText }, { label: "Version churn", value: "12%", icon: Sparkles }].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                <Icon className="h-4 w-4 text-violet-500" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demo pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {demoStages.map((stage) => (
              <div key={stage.title} className="rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
                <p className="text-sm font-medium text-violet-600 dark:text-violet-300">{stage.title}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{stage.detail}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                  Details <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
