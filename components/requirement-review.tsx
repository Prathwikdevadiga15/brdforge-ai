"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function RequirementReview({ projectId, requirementId, status }: { projectId: string; requirementId: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const approved = status === "approved" || status === "validated";

  async function updateStatus() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/requirements/${encodeURIComponent(requirementId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      const result = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Requirement could not be approved.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Requirement could not be approved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" disabled={approved || busy} onClick={updateStatus} className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-700 hover:border-violet-300 hover:text-violet-700 disabled:cursor-default disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
        {busy ? <LoaderCircle className="animate-spin" size={12} /> : <Check size={12} />}
        {approved ? "Approved" : "Approve requirement"}
      </button>
      {error && <span role="alert" className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
