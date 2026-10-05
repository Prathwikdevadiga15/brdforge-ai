"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  FileCheck2,
  FileImage,
  FilePlus2,
  FileText,
  GitBranch,
  Layers3,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Workflow,
  X,
} from "lucide-react";
import { projectSummaries } from "@/lib/mock-data";
import type { ProjectSummary } from "@/lib/types";

const steps = [
  { label: "Sources ingested", detail: "14 files normalized", icon: Upload },
  { label: "Requirements extracted", detail: "24 candidates found", icon: Sparkles },
  { label: "Conflicts reconciled", detail: "2 need your review", icon: GitBranch },
  { label: "BRD generated", detail: "Version 1.2 is ready", icon: FileCheck2 },
];

const attentionItems = [
  {
    id: "sla",
    tag: "HIGH PRIORITY",
    title: "SLA target differs across sources",
    detail: "Operations notes say 24 hours. The policy document specifies 48 hours.",
    sources: ["Ops sync · 09:42", "Service policy · p. 12"],
    initial: "24h vs 48h",
  },
  {
    id: "retention",
    tag: "NEEDS REVIEW",
    title: "Evidence retention needs confirmation",
    detail: "The seven-year retention rule appears in one source and needs an owner.",
    sources: ["Compliance handbook · p. 8"],
    initial: "1 source",
  },
];

function shortDate() {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
}

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [customProjects, setCustomProjects] = useState<{ id: string; name: string; domain: string }[]>([]);
  const [databaseProjects, setDatabaseProjects] = useState<ProjectSummary[]>([]);
  const [projectName, setProjectName] = useState("");
  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === "#new-project") {
        setNewProjectOpen(true);
        window.history.replaceState(null, "", window.location.pathname);
      }
    };
    const openFromNavigation = () => setNewProjectOpen(true);
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    window.addEventListener("brdforge:open-new-project", openFromNavigation);
    fetch("/api/health")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not read service status.");
        const result = await response.json() as { services?: { database?: boolean } };
        const configured = Boolean(result.services?.database);
        setDatabaseReady(configured);
        if (configured) {
          const projectsResponse = await fetch("/api/projects");
          if (!projectsResponse.ok) throw new Error("Could not load saved projects.");
          const projectsResult = await projectsResponse.json() as { projects?: ProjectSummary[] };
          setDatabaseProjects(projectsResult.projects ?? []);
        }
      })
      .catch(() => setDatabaseReady(false));
    return () => {
      window.removeEventListener("hashchange", openFromHash);
      window.removeEventListener("brdforge:open-new-project", openFromNavigation);
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    const projects = databaseReady ? databaseProjects : projectSummaries;
    return projects.filter((project) => !query || `${project.name} ${project.domain} ${project.owner}`.toLowerCase().includes(query));
  }, [databaseProjects, databaseReady, search]);
  const filteredCustomProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customProjects.filter((project) => !query || `${project.name} ${project.domain} Prathwik S`.toLowerCase().includes(query));
  }, [customProjects, search]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = projectName.trim();
    if (!cleanName) return;
    if (databaseReady === null) {
      showToast("Checking project storage. Please try again in a moment.");
      return;
    }
    if (databaseReady) {
      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cleanName, domain: "General", owner: "Prathwik S" }),
        });
        const result = await response.json() as { ok: boolean; error?: string; project?: { id: string; name: string; domain: string; status: string; health: number; owner: string; updatedAt: string } };
        if (!response.ok || !result.ok || !result.project) throw new Error(result.error || "Project could not be saved.");
        setDatabaseProjects((current) => [{
          id: result.project!.id,
          name: result.project!.name,
          domain: result.project!.domain,
          status: result.project!.status,
          health: result.project!.health,
          owner: result.project!.owner,
          lastUpdated: result.project!.updatedAt,
        }, ...current]);
        setProjectName("");
        setNewProjectOpen(false);
        showToast(`${cleanName} saved to PostgreSQL`);
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Project could not be saved.");
      }
      return;
    }
    const id = `project-${Date.now()}`;
    setCustomProjects((current) => [{ id, name: cleanName, domain: "New project" }, ...current]);
    setProjectName("");
    setNewProjectOpen(false);
    showToast(`${cleanName} added to this browser session only · configure PostgreSQL to save`);
  }

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (databaseReady === null) {
      showToast("Checking project storage. Please try again in a moment.");
      return;
    }
    if (!databaseReady) {
      showToast("Source files are not saved in demo mode. Configure PostgreSQL to ingest sources.");
      return;
    }
    for (const file of files) {
      const body = new FormData();
      body.append("file", file);
      body.append("type", "document");
      try {
        const response = await fetch("/api/projects/atlas-ops/sources", { method: "POST", body });
        const result = await response.json() as { ok: boolean; error?: string; extractionMode?: string; requirements?: unknown[] };
        if (!response.ok || !result.ok) {
          showToast(result.error || `${file.name} could not be processed.`);
          return;
        }
        showToast(`${file.name}: ${result.requirements?.length ?? 0} candidate(s) · ${result.extractionMode} · saved for review`);
      } catch {
        showToast(`${file.name} could not be uploaded. Check the network and try again.`);
        return;
      }
    }
  }

  const openConflicts = attentionItems.length;

  return (
    <div className="dashboard-page">
      {toast && <div className="toast-message" role="status"><Check size={15} />{toast}<button onClick={() => setToast("")} aria-label="Dismiss"><X size={14} /></button></div>}
      <section className="dashboard-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> {shortDate()} <span className="eyebrow-dot">·</span> YOUR COMMAND CENTER</div>
          <h1>Good morning, Prathwik <span className="wave">✳</span></h1>
          <p>Here&apos;s what&apos;s happening across your requirements today.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-secondary" onClick={() => uploadRef.current?.click()}><Upload size={16} /> Add sources</button>
          <input ref={uploadRef} className="visually-hidden" type="file" multiple accept=".txt,.md,.csv,.json" onChange={onUpload} />
          <button className="button button-primary" onClick={() => setNewProjectOpen(true)}><Plus size={16} /> Create project</button>
        </div>
      </section>
      <section className="metric-grid" aria-label="Workspace metrics">
        <article className="metric-card">
          <div className="metric-top"><span className="metric-icon icon-violet"><Workflow size={17} /></span><span className="metric-trend trend-positive"><ArrowUpRight size={13} /> 2 this month</span></div>
          <p className="metric-label">Active projects</p><strong className="metric-value">{String((databaseReady ? databaseProjects.length : projectSummaries.length) + customProjects.length).padStart(2, "0")}</strong>
          <div className="metric-foot"><span className="metric-bar"><i style={{ width: "70%" }} /></span><span>Across 3 workstreams</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-icon icon-blue"><Layers3 size={17} /></span><span className="metric-trend trend-positive"><ArrowUpRight size={13} /> 12% this week</span></div>
          <p className="metric-label">Requirements captured</p><strong className="metric-value">236</strong>
          <div className="metric-foot"><span className="metric-bar"><i style={{ width: "82%" }} /></span><span>Across all projects</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-icon icon-amber"><GitBranch size={17} /></span><span className="metric-trend trend-neutral"><Clock3 size={13} /> Needs attention</span></div>
          <p className="metric-label">Open decisions</p><strong className="metric-value">{String(openConflicts).padStart(2, "0")}</strong>
          <div className="metric-foot"><span className="metric-bar bar-amber"><i style={{ width: `${openConflicts ? 45 : 5}%` }} /></span><span>Across 2 projects</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span className="metric-icon icon-green"><ShieldCheck size={17} /></span><span className="metric-trend trend-positive"><ArrowUpRight size={13} /> 4% this month</span></div>
          <p className="metric-label">Evidence coverage</p><strong className="metric-value">94<span className="value-unit">%</span></strong>
          <div className="metric-foot"><span className="metric-bar bar-green"><i style={{ width: "94%" }} /></span><span>Healthy · 90% target</span></div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="surface-card pipeline-card">
          <div className="section-heading">
            <div><div className="section-kicker">AI WORKFLOW</div><h2>Your evidence pipeline</h2><p>From fragmented inputs to a decision-ready BRD.</p></div>
            <Link href="/demo" className="text-link">See how it works <ArrowRight size={14} /></Link>
          </div>
          <div className="pipeline-project">
            <div className="pipeline-project-logo"><Workflow size={18} /></div>
            <div><strong>Atlas Ops Hub</strong><span>Last processed 18 minutes ago</span></div>
            <span className="live-state"><i /> Pipeline complete</span>
            <Link href="/projects/atlas-ops" aria-label="Open Atlas Ops Hub"><ChevronRight size={17} /></Link>
          </div>
          <div className="pipeline-steps">
            {steps.map(({ label, detail, icon: Icon }, index) => (
              <div key={label} className={`pipeline-step ${index < 3 ? "step-complete" : ""}`}>
                <div className="step-connector" /><span className="step-icon">{index < 3 ? <Check size={14} /> : <Icon size={15} />}</span>
                <div className="step-copy"><strong>{label}</strong><span>{detail}</span></div>
                {index === 3 && <span className="step-version">v1.2</span>}
              </div>
            ))}
          </div>
          <div className="pipeline-footer"><span><ShieldCheck size={15} /> Every statement is grounded in source evidence</span><Link href="/projects/atlas-ops">Open project <ArrowRight size={14} /></Link></div>
        </article>

        <article className="surface-card attention-card">
          <div className="section-heading">
            <div><div className="section-kicker">HUMAN IN THE LOOP</div><h2>Needs your attention <span className="heading-count">{openConflicts}</span></h2><p>Resolve ambiguity before it reaches the BRD.</p></div>
            <button className="icon-quiet" aria-label="More attention options"><MoreHorizontal size={19} /></button>
          </div>
          <div className="attention-list">
            {attentionItems.map((item) => (
              <div className={`attention-item ${item.id === "sla" ? "attention-high" : ""}`} key={item.id}>
                <div className={`attention-indicator ${item.id === "sla" ? "indicator-red" : "indicator-amber"}`}><CircleDot size={14} /></div>
                <div className="attention-copy">
                  <div className="attention-meta"><span className={`priority-tag ${item.id === "sla" ? "priority-high" : "priority-review"}`}>{item.tag}</span><span>{item.initial}</span></div>
                  <strong>{item.title}</strong><p>{item.detail}</p>
                  <div className="source-chips">{item.sources.map((source) => <span key={source}><FileText size={11} />{source}</span>)}</div>
                  <Link className="review-link" href="/projects/atlas-ops#conflicts">Review decision <ArrowRight size={13} /></Link>
                </div>
              </div>
            ))}
          </div>
          <Link href="/projects/atlas-ops" className="attention-footer">View all decisions <ArrowRight size={14} /></Link>
        </article>
      </section>

      <section className="surface-card projects-card">
        <div className="section-heading projects-heading">
          <div><div className="section-kicker">YOUR PORTFOLIO</div><h2>Recent projects</h2><p>Keep an eye on the work moving forward.</p></div>
          <div className="project-heading-actions">
            <label className="project-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter projects" aria-label="Filter projects" /></label>
            <Link href="/projects" className="text-link">All projects <ArrowRight size={14} /></Link>
          </div>
        </div>
        <div className="project-table-wrap">
          <table className="project-table">
            <thead><tr><th>PROJECT</th><th>STATUS</th><th>HEALTH</th><th>OWNER</th><th>UPDATED</th><th /></tr></thead>
            <tbody>
              {filteredCustomProjects.map((project) => (
                <tr key={project.id}>
                  <td><span className="project-name-cell"><span className="project-glyph glyph-lime"><FilePlus2 size={15} /></span><span><strong>{project.name}</strong><small>{project.domain}</small></span></span></td>
                  <td><span className="status-pill status-draft"><i /> Draft</span></td>
                  <td><span className="health-cell"><span className="health-track"><i style={{ width: "8%" }} /></span><strong>8%</strong></span></td>
                  <td><span className="owner-cell"><span className="owner-avatar">PS</span> Prathwik S</span></td>
                  <td className="updated-cell">Just now</td><td><Link className="row-arrow" href={`/projects/${project.id}`} aria-label={`Open ${project.name}`}><ArrowUpRight size={16} /></Link></td>
                </tr>
              ))}
              {filteredProjects.map((project, index) => (
                <tr key={project.id}>
                  <td><span className="project-name-cell"><span className={`project-glyph ${index === 0 ? "glyph-purple" : index === 1 ? "glyph-blue" : "glyph-orange"}`}>{index === 0 ? <Workflow size={15} /> : index === 1 ? <FileImage size={15} /> : <ShieldCheck size={15} />}</span><span><strong>{project.name}</strong><small>{project.domain}</small></span></span></td>
                  <td><span className={`status-pill ${project.health < 70 ? "status-risk" : project.health > 90 ? "status-ready" : "status-review"}`}><i />{project.status}</span></td>
                  <td><span className="health-cell"><span className="health-track"><i className={project.health < 70 ? "health-risk" : ""} style={{ width: `${project.health}%` }} /></span><strong>{project.health}%</strong></span></td>
                  <td><span className="owner-cell"><span className={`owner-avatar owner-${index}`}>{project.owner.split(" ").map((part) => part[0]).join("")}</span>{project.owner}</span></td>
                  <td className="updated-cell">{project.lastUpdated}</td><td><Link className="row-arrow" href={`/projects/${project.id}`} aria-label={`Open ${project.name}`}><ArrowUpRight size={16} /></Link></td>
                </tr>
              ))}
              {filteredProjects.length === 0 && filteredCustomProjects.length === 0 && <tr><td colSpan={6} className="empty-projects">No projects match “{search}”. Try another search.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="projects-card-footer"><span>Showing {filteredProjects.length + filteredCustomProjects.length} projects in your workspace</span><button onClick={() => setNewProjectOpen(true)}><Plus size={14} /> Create a project</button></div>
      </section>

      <section className="dashboard-bottom-row">
        <div className="trust-note"><span className="trust-icon"><ShieldCheck size={17} /></span><span><strong>Built for traceability, not black boxes.</strong><small>Every extracted requirement links back to the source that supports it.</small></span><Link href="/projects/atlas-ops">Explore evidence <ArrowRight size={13} /></Link></div>
        <div className="usage-note"><span className="usage-dot" /><span>All systems operational</span><span className="usage-divider" /> Demo mode</div>
      </section>

      {newProjectOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNewProjectOpen(false); }}>
          <section className="project-modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
            <button className="modal-close" onClick={() => setNewProjectOpen(false)} aria-label="Close"><X size={17} /></button>
            <span className="modal-icon"><Plus size={18} /></span>
            <div className="section-kicker">GET STARTED</div>
            <h2 id="new-project-title">Start a new project</h2>
            <p>Give your workspace a name. You can add source documents next.</p>
            <form onSubmit={createProject}>
              <label htmlFor="project-name">Project name</label>
              <input id="project-name" autoFocus value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="e.g. Customer onboarding refresh" maxLength={80} required />
              <div className="modal-actions"><button className="button button-secondary" type="button" onClick={() => setNewProjectOpen(false)}>Cancel</button><button className="button button-primary" type="submit">Create project <ArrowRight size={15} /></button></div>
            </form>
            <div className="modal-note"><ArrowDownRight size={14} /> Project creation is local to this demo session.</div>
          </section>
        </div>
      )}
    </div>
  );
}
