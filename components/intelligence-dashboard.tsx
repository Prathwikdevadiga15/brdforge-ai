"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity, ArrowRight, Check, ChevronDown, CircleHelp, GitBranch,
  Leaf, Network, ShieldAlert, ShieldCheck, Sparkles, Users, Zap,
} from "lucide-react";
import type { getProjectIntelligence } from "@/lib/intelligence";

type Intelligence = ReturnType<typeof getProjectIntelligence>;

const nodeColors: Record<string, string> = {
  SOURCE: "#7887dc", EVIDENCE: "#52a783", REQUIREMENT: "#7965d7",
  STAKEHOLDER: "#d99450", BRD_SECTION: "#4f9db0", CONFLICT: "#d76868",
};
const graphTypes = ["SOURCE", "EVIDENCE", "REQUIREMENT", "STAKEHOLDER", "BRD_SECTION", "CONFLICT"];

export function IntelligenceDashboard({
  projectId, projectName, intelligence, persistent,
}: {
  projectId: string;
  projectName: string;
  intelligence: Intelligence;
  persistent: boolean;
}) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeFilter, setNodeFilter] = useState<string[]>(graphTypes);
  const [query, setQuery] = useState("");
  const [ecoMode, setEcoMode] = useState(intelligence.eco.ecoModeEnabled);
  const [ecoMessage, setEcoMessage] = useState("");
  const [copilotAction, setCopilotAction] = useState("");
  const [copilotMessage, setCopilotMessage] = useState("");
  const [criteria, setCriteria] = useState<Record<string, string[]>>({});
  const [criteriaMessage, setCriteriaMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const visibleNodes = useMemo(() => intelligence.graph.nodes.filter((node) =>
    nodeFilter.includes(node.type) && (!query || `${node.label} ${node.detail}`.toLowerCase().includes(query.toLowerCase())),
  ), [intelligence.graph.nodes, nodeFilter, query]);
  const selected = visibleNodes.find((node) => node.id === selectedNode);
  const visibleEdges = intelligence.graph.edges.filter((edge) =>
    visibleNodes.some((node) => node.id === edge.from) && visibleNodes.some((node) => node.id === edge.to),
  );
  const positions = visibleNodes.map((node, index) => {
    const angle = (index / Math.max(visibleNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return { ...node, x: 340 + Math.cos(angle) * 235, y: 180 + Math.sin(angle) * 135 };
  });
  const positionById = new Map(positions.map((node) => [node.id, node]));

  function toggleFilter(type: string) {
    setNodeFilter((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  async function analyzeEco() {
    setEcoMessage("");
    if (!persistent) {
      setEcoMessage("Preview only: set DATABASE_URL to store Eco analysis.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/eco`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ecoModeEnabled: ecoMode }),
      });
      const result = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Eco analysis could not be saved.");
      setEcoMessage("Estimated Eco metrics saved.");
    } catch (error) {
      setEcoMessage(error instanceof Error ? error.message : "Eco analysis failed.");
    } finally {
      setBusy(false);
    }
  }

  function runCopilot() {
    if (!copilotAction) return;
    const highRisk = intelligence.risk.filter((item) => item.level === "HIGH");
    const evidence = intelligence.graph.nodes.filter((node) => node.type === "EVIDENCE").slice(0, 2);
    if (copilotAction === "Find contradictions") {
      const conflicts = intelligence.graph.nodes.filter((node) => node.type === "CONFLICT");
      setCopilotMessage(conflicts.length
        ? `${conflicts.length} conflict(s) are linked to this project: ${conflicts.map((item) => `${item.label} (${item.detail})`).join("; ")}. Review the linked project decisions before approval.`
        : "No conflicts are recorded in this project.");
    } else if (copilotAction === "Find unsupported claims") {
      const unsupported = intelligence.risk.filter((risk) => risk.reasons.some((reason) => reason.includes("No supporting evidence")));
      setCopilotMessage(unsupported.length
        ? `${unsupported.length} requirement(s) have no linked evidence. Open the requirement ledger and add a source excerpt.`
        : `Every current requirement has at least one evidence link. Example sources: ${evidence.map((item) => item.label).join(", ")}.`);
    } else if (copilotAction === "Analyze risk") {
      setCopilotMessage(highRisk.length
        ? `${highRisk.length} high-risk requirement(s) need attention: ${highRisk.map((risk) => intelligence.quality.find((item) => item.id === risk.id)?.title ?? risk.id).join(", ")}. Risk uses deterministic confidence, evidence, conflict and review-status signals—not a prediction guarantee.`
        : "No high-risk requirements were flagged by the deterministic risk checks.");
    } else if (copilotAction === "Find stakeholder gaps") {
      setCopilotMessage(`${intelligence.stakeholders.length} named owner profile(s) are represented. Unassigned requirements and pending reviews are counted as stakeholder gaps; confirm these owners with the project team.`);
    } else {
      setCopilotMessage(`Project ${projectName} has ${intelligence.executive.requirements} requirements and a ${intelligence.score.score}/100 intelligence score. ${intelligence.executive.summary}`);
    }
  }

  function generateAcceptance(requirementId: string, title: string, summary: string) {
    const compact = summary.trim().replace(/[.!?]+$/, "");
    const draft = [
      `Given the user is working with “${title}”`,
      `When the user follows this requirement: ${compact}`,
      "Then the system produces the documented outcome and records the supporting evidence.",
    ];
    setCriteria((current) => ({ ...current, [requirementId]: draft }));
    setCriteriaMessage("Draft criteria generated from requirement text. Review before use.");
  }

  async function approveRequirement(requirementId: string) {
    if (!persistent) {
      setCriteriaMessage("Preview only: configure PostgreSQL to save acceptance criteria or approval.");
      return;
    }
    const acceptance = criteria[requirementId];
    if (!acceptance) return;
    setBusy(true);
    try {
      const [criterionResponse, approvalResponse] = await Promise.all([
        fetch(`/api/requirements/${encodeURIComponent(requirementId)}/acceptance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ given: acceptance[0], when: acceptance[1], then: acceptance[2], status: "approved" }),
        }),
        fetch(`/api/projects/${encodeURIComponent(projectId)}/requirements/${encodeURIComponent(requirementId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "approved" }),
        }),
      ]);
      const criterion = await criterionResponse.json() as { ok: boolean; error?: string };
      const approval = await approvalResponse.json() as { ok: boolean; error?: string };
      if (!criterionResponse.ok || !criterion.ok) throw new Error(criterion.error || "Criteria could not be saved.");
      if (!approvalResponse.ok || !approval.ok) throw new Error(approval.error || "Requirement approval could not be saved.");
      setCriteriaMessage("Acceptance criteria saved and requirement approved.");
    } catch (error) {
      setCriteriaMessage(error instanceof Error ? error.message : "Review action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-600">Requirements intelligence</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{projectName}</h1><p className="mt-2 text-sm text-slate-500">Evidence, review readiness, scope and risk signals—each score shows its basis.</p></div>
          <Link href={`/projects/${encodeURIComponent(projectId)}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Open requirement ledger <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Sparkles size={17} />} label="Requirement intelligence" value={`${intelligence.score.score}/100`} detail="Weighted, explainable score" tint="violet" />
        <MetricCard icon={<ShieldAlert size={17} />} label="High-risk requirements" value={String(intelligence.risk.filter((risk) => risk.level === "HIGH").length).padStart(2, "0")} detail="Rules-based review signals" tint="amber" />
        <MetricCard icon={<GitBranch size={17} />} label="Potential scope expansion" value={intelligence.scope.expansionLevel} detail={`${intelligence.scope.added} recent addition(s) · inferred`} tint="blue" />
        <MetricCard icon={<Leaf size={17} />} label="Estimated Eco score" value={`${intelligence.eco.score}/100`} detail="Not a measured carbon score" tint="green" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Intelligence score breakdown" eyebrow="EXPLAINABLE QUALITY">
          <div className="space-y-3">
            {intelligence.score.factors.map((factor) => <div key={factor.key}>
              <div className="mb-1 flex items-center justify-between gap-3"><span className="text-xs font-medium text-slate-700 dark:text-slate-200">{factor.label} <span className="text-slate-400">· {factor.weight}% weight</span></span><strong className="text-xs">{factor.score}</strong></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-violet-500" style={{ width: `${factor.score}%` }} /></div>
              <p className="mt-1 text-[10px] text-slate-400">{factor.detail}</p>
            </div>)}
          </div>
        </Panel>

        <Panel title="Requirement risk center" eyebrow="DETERMINISTIC SIGNALS">
          <div className="max-h-[350px] space-y-2 overflow-auto pr-1">
            {intelligence.risk.map((risk) => {
              const requirement = intelligence.quality.find((item) => item.id === risk.id);
              return <details key={risk.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <summary className="flex cursor-pointer list-none items-center gap-2">
                  <span className={`rounded px-2 py-1 text-[9px] font-bold ${risk.level === "HIGH" ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" : risk.level === "MEDIUM" ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>{risk.level} · {risk.score}</span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">{requirement?.title ?? risk.id}</span><ChevronDown size={14} className="text-slate-400" />
                </summary>
                <ul className="mt-3 space-y-1">{risk.reasons.map((reason) => <li key={reason} className="text-[11px] text-slate-500">• {reason}</li>)}</ul>
                <p className="mt-2 text-[11px] text-violet-700 dark:text-violet-300">Next: {risk.recommendation}</p>
              </details>;
            })}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Panel title="Requirement knowledge graph" eyebrow="PROJECT-SCOPED LINKS" icon={<Network size={16} />}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search graph nodes" aria-label="Search graph nodes" className="h-9 min-w-40 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-950" />
            <button type="button" onClick={() => setNodeFilter(graphTypes)} className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-medium dark:border-slate-700">Show all node types</button>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {graphTypes.map((type) => <button key={type} type="button" aria-pressed={nodeFilter.includes(type)} onClick={() => toggleFilter(type)} className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${nodeFilter.includes(type) ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200" : "border-slate-200 text-slate-400 dark:border-slate-700"}`}>{type.replace("_", " ")}</button>)}
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
            <svg viewBox="0 0 680 360" className="h-[300px] w-full" role="img" aria-label="Interactive project evidence graph">
              {visibleEdges.map((edge) => {
                const from = positionById.get(edge.from); const to = positionById.get(edge.to);
                if (!from || !to) return null;
                return <g key={`${edge.from}-${edge.to}-${edge.type}`}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={selectedNode && edge.from !== selectedNode && edge.to !== selectedNode ? "#e2e4ea" : "#aca4ee"} strokeWidth="1.3" />
                  <title>{edge.type.replace("_", " ")}</title>
                </g>;
              })}
              {positions.map((node) => <g key={node.id} tabIndex={0} role="button" aria-label={`${node.type}: ${node.label}`} onClick={() => setSelectedNode(node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedNode(node.id); }} className="cursor-pointer">
                <circle cx={node.x} cy={node.y} r={selectedNode === node.id ? 15 : 11} fill={nodeColors[node.type] ?? "#888"} stroke={selectedNode === node.id ? "#30257f" : "white"} strokeWidth="3" />
                <text x={node.x} y={node.y + 28} textAnchor="middle" fontSize="9" fill="currentColor">{node.label.length > 20 ? `${node.label.slice(0, 18)}…` : node.label}</text>
              </g>)}
            </svg>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-slate-400"><span>{visibleNodes.length} nodes · {visibleEdges.length} recorded relationships · zoom/pan not enabled</span><span>Click a node to inspect</span></div>
          {selected && <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50/70 p-3 dark:border-violet-950 dark:bg-violet-950/30"><div className="flex items-center justify-between"><strong className="text-xs">{selected.type.replace("_", " ")} · {selected.label}</strong><button type="button" onClick={() => setSelectedNode(null)} className="text-[10px] text-violet-700">Clear</button></div><p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">{selected.detail}</p></div>}
          <p className="mt-3 text-[10px] text-slate-400">{intelligence.graph.meta.note} User stories, dependencies and test cases appear as they are added.</p>
        </Panel>

        <div className="space-y-5">
          <Panel title="Stakeholder intelligence" eyebrow="OWNER COVERAGE" icon={<Users size={16} />}>
            <div className="space-y-2">{intelligence.stakeholders.map((person) => <div key={person.name} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5 dark:border-slate-800"><span className="grid h-8 w-8 place-items-center rounded-full bg-violet-50 text-[10px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-200">{person.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span><div className="min-w-0 flex-1"><strong className="block truncate text-xs">{person.name}</strong><span className="text-[10px] text-slate-400">{person.requirements} requirement(s) · {person.priorityAreas.join(", ")}</span></div><span className="text-right text-[9px] text-slate-500">{person.approvals} approved<br />{person.openQuestions} open</span></div>)}</div>
          </Panel>
          <Panel title="Eco mode" eyebrow="EFFICIENCY ESTIMATE" icon={<Leaf size={16} />}>
            <div className="flex items-center justify-between"><div><strong className="text-2xl">{intelligence.eco.score}<span className="text-sm text-slate-400">/100</span></strong><p className="text-[10px] text-slate-400">Efficiency {intelligence.eco.processingEfficiency}% · estimated duplicate work avoided {intelligence.eco.estimatedDuplicateWorkAvoided}%</p></div><button type="button" aria-pressed={ecoMode} onClick={() => setEcoMode((current) => !current)} className={`relative h-6 w-11 rounded-full transition ${ecoMode ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${ecoMode ? "left-6" : "left-1"}`} /></button></div>
            <button disabled={busy} type="button" onClick={analyzeEco} className="mt-3 inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[10px] font-semibold disabled:opacity-50 dark:border-slate-700"><Zap size={13} />{busy ? "Saving…" : "Analyze and save estimate"}</button>
            {ecoMessage && <p role="status" className="mt-2 text-[10px] text-slate-500">{ecoMessage}</p>}
            <p className="mt-2 text-[9px] leading-relaxed text-slate-400">{intelligence.eco.explanation}</p>
          </Panel>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Requirement quality lab" eyebrow="RULE-BASED QUALITY CHECKS" icon={<ShieldCheck size={16} />}>
          <div className="max-h-[390px] space-y-3 overflow-auto pr-1">
            {intelligence.quality.map((item) => {
              const risk = intelligence.risk.find((candidate) => candidate.id === item.id);
              return <article key={item.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] text-slate-400">{item.id}</p><h3 className="text-xs font-semibold">{item.title}</h3></div><strong className="text-lg">{item.overall}<span className="text-[10px] text-slate-400">/100</span></strong></div>
                <div className="mt-2 grid grid-cols-5 gap-1">{item.dimensions.map((dimension) => <div key={dimension.label} className="rounded bg-slate-50 p-1.5 text-center dark:bg-slate-950"><strong className="block text-[10px]">{dimension.score}</strong><span className="text-[8px] text-slate-400">{dimension.label}</span></div>)}</div>
                {risk && <p className="mt-2 text-[9px] text-amber-700 dark:text-amber-300">Risk: {risk.level} · {risk.recommendation}</p>}
                <button type="button" onClick={() => { setCriteriaMessage(`Improvement suggestion: clarify measurable outcomes and keep the existing evidence links for ${item.id}. The original text remains unchanged.`); }} className="mt-2 text-[10px] font-semibold text-violet-700 dark:text-violet-300">Improve requirement (suggestion)</button>
              </article>;
            })}
          </div>
          {criteriaMessage && <p role="status" className="mt-2 text-[10px] text-slate-500">{criteriaMessage}</p>}
        </Panel>
        <Panel title="Acceptance criteria drafts" eyebrow="GIVEN · WHEN · THEN">
          <div className="max-h-[390px] space-y-3 overflow-auto pr-1">
            {intelligence.quality.map((item) => {
              const lines = criteria[item.id];
              const risk = intelligence.risk.find((candidate) => candidate.id === item.id);
              return <article key={item.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-semibold">{item.id} · {item.title}</h3><button type="button" onClick={() => generateAcceptance(item.id, item.title, item.summary)} className="text-[9px] font-semibold text-violet-700 dark:text-violet-300">Generate draft</button></div>
                {lines ? <div className="mt-2 space-y-1">
                  {lines.map((line, index) => <label key={`${item.id}-${index}`} className="grid grid-cols-[44px_1fr] items-start gap-2 text-[9px] text-slate-400"><span>{["Given", "When", "Then"][index]}</span><input value={line} onChange={(event) => setCriteria((current) => ({ ...current, [item.id]: current[item.id].map((entry, i) => i === index ? event.target.value : entry) }))} className="min-w-0 rounded border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" /></label>)}
                  <button disabled={busy} type="button" onClick={() => approveRequirement(item.id)} className="mt-1 inline-flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1.5 text-[9px] font-semibold text-white disabled:opacity-50"><Check size={11} />Approve &amp; save</button>
                </div> : <p className="mt-2 text-[9px] text-slate-400">{risk ? "Generate editable draft criteria; review before approval." : "No generated criteria."}</p>}
              </article>;
            })}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Scope change watch" eyebrow="VERSION COMPARISON" icon={<GitBranch size={16} />}>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><span className="text-[9px] text-slate-400">Current requirements</span><strong className="mt-1 block text-2xl">{intelligence.scope.currentRequirements}</strong></div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><span className="text-[9px] text-slate-400">Added (inferred)</span><strong className="mt-1 block text-2xl">+{intelligence.scope.added}</strong></div>
            <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30"><span className="text-[9px] text-slate-400">Expansion signal</span><strong className="mt-1 block text-lg">{intelligence.scope.expansionLevel}</strong></div>
          </div>
          <div className="mt-3 space-y-2">{intelligence.scope.changes.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-2 text-[10px] dark:border-slate-800"><span className="font-medium">{item.title}</span><span className="text-slate-400">{item.status}</span></div>)}</div>
          <p className="mt-3 text-[9px] text-slate-400">{intelligence.scope.note}</p>
        </Panel>
        <Panel title="Executive decision brief" eyebrow="BUSINESS SUMMARY" icon={<Activity size={16} />}>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{intelligence.executive.summary}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <SmallStat label="BRD health" value={`${intelligence.executive.health}%`} />
            <SmallStat label="Critical decisions" value={String(intelligence.executive.pendingDecisions)} />
            <SmallStat label="High risk" value={String(intelligence.executive.highRiskRequirements)} />
            <SmallStat label="Low confidence" value={String(intelligence.executive.lowConfidenceRequirements)} />
          </div>
          <Link href={`/projects/${encodeURIComponent(projectId)}/executive`} className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 dark:text-violet-300">Open executive view <ArrowRight size={12} /></Link>
        </Panel>
      </section>

      <Panel title="Evidence-backed review copilot" eyebrow="CONCISE ANSWERS · NO PRIVATE REASONING" icon={<CircleHelp size={16} />}>
        <div className="flex flex-wrap gap-2">
          {["Summarize project", "Find contradictions", "Find unsupported claims", "Find stakeholder gaps", "Analyze risk"].map((action) => <button type="button" key={action} onClick={() => { setCopilotAction(action); setCopilotMessage(""); }} className={`rounded-full border px-3 py-1.5 text-[10px] font-medium ${copilotAction === action ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200" : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>{action}</button>)}
          <button type="button" disabled={!copilotAction} onClick={runCopilot} className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-3 py-1.5 text-[10px] font-semibold text-white disabled:opacity-40"><Sparkles size={12} />Run review</button>
        </div>
        {copilotMessage && <div role="status" className="mt-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3 text-xs leading-relaxed text-slate-700 dark:border-violet-950 dark:bg-violet-950/30 dark:text-slate-200">{copilotMessage}<p className="mt-2 text-[9px] text-slate-400">Rule-based project summary. Verify recommendations against the cited source records.</p></div>}
      </Panel>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, tint }: { icon: React.ReactNode; label: string; value: string; detail: string; tint: string }) {
  const colors: Record<string, string> = { violet: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-200", amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200", blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200", green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200" };
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><span className={`grid h-8 w-8 place-items-center rounded-lg ${colors[tint]}`}>{icon}</span><p className="mt-3 text-xs text-slate-500">{label}</p><strong className="mt-1 block text-2xl">{value}</strong><p className="mt-1 text-[10px] text-slate-400">{detail}</p></article>;
}

function Panel({ title, eyebrow, icon, children }: { title: string; eyebrow: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="mb-4 flex items-start justify-between"><div><p className="text-[9px] font-semibold tracking-[.15em] text-slate-400">{eyebrow}</p><h2 className="mt-1 flex items-center gap-2 text-sm font-semibold">{icon}{title}</h2></div></div>{children}</section>;
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-100 p-2.5 dark:border-slate-800"><span className="block text-[9px] text-slate-400">{label}</span><strong className="mt-1 block text-base">{value}</strong></div>;
}
