"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpenText,
  ChevronDown,
  CircleHelp,
  Command,
  FileCheck2,
  FileChartColumnIncreasing,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Requirements", href: "/projects/atlas-ops#requirements", icon: FileCheck2 },
  { label: "Intelligence", href: "/projects/atlas-ops/intelligence", icon: Activity },
  { label: "Stakeholders", href: "/projects/atlas-ops/stakeholders", icon: Users },
  { label: "Executive view", href: "/projects/atlas-ops/executive", icon: FileChartColumnIncreasing },
  { label: "Eco intelligence", href: "/eco", icon: Sparkles },
  { label: "Product demo", href: "/demo", icon: BookOpenText },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<{ id: string; type: string; title: string; detail: string; href: string }[]>([]);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!searchOpen || query.length < 2) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?projectId=atlas-ops&q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const result = await response.json() as { ok: boolean; error?: string; results?: typeof results };
        if (!response.ok || !result.ok) throw new Error(result.error || "Search failed.");
        setResults(result.results ?? []);
        setSearchError("");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSearchError(error instanceof Error ? error.message : "Search is unavailable.");
      }
    }, 180);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [searchOpen, searchQuery]);

  if (pathname === "/") return <>{children}</>;

  const pageTitle = pathname.startsWith("/projects/")
    ? "Project workspace"
    : navigation.find((item) => item.href === pathname)?.label ?? "Settings";

  return (
    <div className="workspace-shell min-h-screen">
      <aside className="workspace-sidebar">
        <Link href="/dashboard" className="brand-lockup" aria-label="BRDForge home">
          <span className="brand-mark"><Sparkles size={18} strokeWidth={2.2} /></span>
          <span className="brand-name">brdforge<span>.ai</span></span>
        </Link>
        <button className="workspace-switcher" type="button">
          <span className="workspace-avatar">H</span>
          <span className="workspace-switcher-copy"><strong>HACKSPHERE</strong><small>Personal workspace</small></span>
          <ChevronDown size={15} />
        </button>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = href === "/dashboard"
              ? pathname === "/dashboard"
              : href === "/projects"
                ? pathname === "/projects"
                : href.startsWith("/projects/")
                  ? pathname.startsWith("/projects/")
                  : pathname === href;
            return (
              <Link key={label} href={href} className={`sidebar-link${active ? " is-active" : ""}`}>
                <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
                {label === "Projects" && <span className="nav-count">3</span>}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-section-label sidebar-section-spaced">MANAGE</div>
        <nav className="sidebar-nav" aria-label="Workspace settings">
          <Link href="/settings" className={`sidebar-link${pathname === "/settings" ? " is-active" : ""}`}>
            <Settings2 size={17} strokeWidth={1.8} /><span>Settings</span>
          </Link>
          <a className="sidebar-link" href="mailto:hello@brdforge.ai">
            <CircleHelp size={17} strokeWidth={1.8} /><span>Help &amp; support</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="plan-card">
            <div className="plan-card-heading"><Sparkles size={14} /> Your workspace</div>
            <p>Explore the seeded demo and see how evidence becomes a living BRD.</p>
            <Link href="/demo">Explore the demo <span aria-hidden="true">→</span></Link>
          </div>
          <button className="profile-button" type="button">
            <span className="profile-avatar">PS</span>
            <span className="profile-copy"><strong>Prathwik S</strong><small>Workspace owner</small></span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="topbar-context"><span>HACKSPHERE</span><span className="crumb-divider">/</span><strong>{pageTitle}</strong></div>
          <div className="topbar-actions">
            <button type="button" className="global-search" onClick={() => setSearchOpen(true)} aria-label="Search workspace (Ctrl+K)"><Search size={15} /><span>Search anything...</span><kbd><Command size={11} /> K</kbd></button>
            <button className="icon-button" type="button" aria-label="Activity"><Activity size={17} /></button>
            <button className="icon-button notification-button" type="button" aria-label="Notifications"><Bell size={17} /><span /></button>
            <Link
              href="/dashboard#new-project"
              onClick={(event) => {
                if (pathname === "/dashboard") {
                  event.preventDefault();
                  window.dispatchEvent(new Event("brdforge:open-new-project"));
                }
              }}
              className="topbar-create"
            >
              <Plus size={15} /> New project
            </Link>
          </div>
        </header>
        <main className="workspace-content">{children}</main>
        <footer className="workspace-footer">
          <span>BRDFORGE AI <span className="footer-dot">·</span> EVIDENCE-LED REQUIREMENTS</span>
          <span><span className="status-pulse" /> Demo workspace</span>
        </footer>
      </div>
      {searchOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-label="Workspace search and commands" className="project-modal !w-[min(100%,620px)] !self-start !mt-[10vh] !p-0">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800"><Search size={17} className="shrink-0 text-slate-400" /><input autoFocus value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setResults([]); setSearchError(""); }} placeholder="Search project evidence or choose a command..." className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none" /><kbd className="rounded border px-1.5 py-1 text-[9px] text-slate-400">ESC</kbd></div>
          <div className="max-h-[55vh] overflow-y-auto p-2">
            {searchError && <p role="alert" className="p-3 text-xs text-red-600">{searchError}</p>}
            {results.map((result) => <button key={`${result.type}:${result.id}`} type="button" onClick={() => { setSearchOpen(false); setSearchQuery(""); router.push(result.href); }} className="flex w-full items-start gap-3 rounded-lg p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800"><span className="mt-0.5 rounded bg-violet-50 px-2 py-1 text-[8px] font-bold uppercase text-violet-700 dark:bg-violet-950 dark:text-violet-200">{result.type}</span><span className="min-w-0"><strong className="block truncate text-xs">{result.title}</strong><small className="mt-1 block truncate text-[10px] text-slate-400">{result.detail}</small></span></button>)}
            {searchQuery.trim().length >= 2 && !results.length && !searchError && <p className="p-4 text-xs text-slate-400">No matching project records.</p>}
            {searchQuery.trim().length < 2 && <div className="space-y-1 p-2">
              <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">Quick commands</p>
              {[
                ["Open BRD", "/projects/atlas-ops"], ["Show conflicts", "/projects/atlas-ops#conflicts"],
                ["Open knowledge graph & risk", "/projects/atlas-ops/intelligence"], ["Open executive view", "/projects/atlas-ops/executive"],
                ["Open Eco intelligence", "/eco"], ["Launch demo", "/demo"],
              ].map(([label, href]) => <button key={label} type="button" onClick={() => { setSearchOpen(false); router.push(href); }} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">{label}<ArrowRight size={13} className="text-slate-400" /></button>)}
            </div>}
          </div>
          <div className="border-t border-slate-100 px-4 py-2 text-[9px] text-slate-400 dark:border-slate-800">Search is project-scoped to Atlas Ops demo · Ctrl+K to open · Esc to close</div>
        </section>
      </div>}
    </div>
  );
}
