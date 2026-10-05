import { ArrowRight, CheckCircle2, FileText, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  { label: "Fragmented inputs", value: "14 sources", icon: FileText },
  { label: "Requirements extracted", value: "24", icon: Layers3 },
  { label: "Conflicts resolved", value: "2 high-risk", icon: ShieldCheck },
  { label: "Evidence confidence", value: "94%", icon: CheckCircle2 },
];

const pipeline = [
  "Multimodal ingestion",
  "AI requirement extraction",
  "Reconciliation & conflict detection",
  "Living BRD generation",
  "Human review & evidence traceability",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-8">
      <header className="mb-10 flex items-center justify-between rounded-full border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 font-semibold text-white">
            B
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-slate-600 dark:text-slate-300">BRDFORGE AI</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 dark:text-slate-300 md:flex">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/demo">Demo</Link>
          <Link href="/settings">Settings</Link>
        </nav>
        <Link href="/dashboard">
          <Button size="sm">Launch workspace</Button>
        </Link>
      </header>

      <section className="grid flex-1 items-center gap-8 pb-8 pt-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <Badge className="mb-4">Evidence-backed, explainable, living requirements</Badge>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight text-slate-950 dark:text-white">
            Fragmented inputs in.<br />
            <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
              BRDs out.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            BRDForge AI turns scattered notes, policies, chats, screenshots, and PDFs into a continuously updated, evidence-backed Business Requirements Document that humans can trust and teams can act on.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button size="lg">
                Explore product
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg">
                View demo flow
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
            {['AI ingestion', 'Conflict detection', 'Version diff', 'DOCX/PDF export'].map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 bg-slate-100/80 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800/80">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-violet-500/15 via-cyan-500/10 to-transparent blur-2xl" />
          <Card className="relative overflow-hidden border-slate-200/80 bg-white/85 shadow-2xl dark:border-slate-700 dark:bg-slate-900/80">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Execution status</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">Atlas Ops Hub</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-3">
                {pipeline.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                      {index + 1}
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-200">{step}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {highlights.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
                      <Icon className="h-4 w-4 text-violet-500" />
                    </div>
                    <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
