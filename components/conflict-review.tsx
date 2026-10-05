"use client";

import { useState } from "react";
import { Check, LoaderCircle, MessageSquareWarning } from "lucide-react";

interface ConflictReviewProps {
  projectId: string;
  conflict: {
    id: string;
    title: string;
    severity: string;
    summary: string;
    resolution: string;
  };
  databaseEnabled: boolean;
}

export function ConflictReview({ projectId, conflict, databaseEnabled }: ConflictReviewProps) {
  const [editing, setEditing] = useState(false);
  const [resolution, setResolution] = useState(conflict.resolution);
  const [saved, setSaved] = useState(Boolean(conflict.resolution && !/awaiting|pending/i.test(conflict.resolution)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/conflicts/${encodeURIComponent(conflict.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });
      const result = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Decision could not be saved.");
      setSaved(true);
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Decision could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-amber-600"><MessageSquareWarning size={17} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{conflict.title}</h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">{conflict.severity}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{conflict.summary}</p>
          {editing ? (
            <div className="mt-3 space-y-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300" htmlFor={`resolution-${conflict.id}`}>Decision and rationale</label>
              <textarea id={`resolution-${conflict.id}`} value={resolution} onChange={(event) => setResolution(event.target.value)} rows={3} maxLength={2000} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900" />
              {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button type="button" disabled={busy || resolution.trim().length < 3} onClick={save} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white disabled:opacity-50">
                  {busy ? <LoaderCircle className="animate-spin" size={13} /> : <Check size={13} />} Save decision
                </button>
                <button type="button" onClick={() => { setEditing(false); setError(""); }} className="h-8 rounded-lg px-3 text-xs text-slate-600">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">{saved ? `Decision: ${resolution}` : "No decision recorded yet."}</p>
              {databaseEnabled
                ? <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{saved ? "Update decision" : "Resolve conflict"}</button>
                : <span className="text-[10px] text-slate-400">Configure PostgreSQL to save decisions</span>}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
