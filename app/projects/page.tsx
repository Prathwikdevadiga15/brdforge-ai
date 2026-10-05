import Link from "next/link";
import { db } from "@/lib/db";
import { projectSummaries } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsPage() {
  let projects = projectSummaries;
  if (process.env.DATABASE_URL) {
    try {
      const records = await db.project.findMany({ orderBy: { updatedAt: "desc" } });
      projects = records.map((project) => ({
        id: project.id,
        name: project.name,
        domain: project.domain,
        status: project.status,
        health: project.health,
        lastUpdated: project.updatedAt.toLocaleDateString(),
        owner: project.owner,
      }));
    } catch (error) {
      console.error("Unable to load the project library from PostgreSQL.", error);
      throw new Error("The project library is unavailable. Check DATABASE_URL and apply database migrations.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge className="mb-3">Project library</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">BRD projects</h1>
        </div>
        <Link href="/dashboard#new-project"><Button>Create project</Button></Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{project.name}</CardTitle>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {project.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-300">{project.domain}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Project health</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{project.health}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" style={{ width: `${project.health}%` }} />
              </div>
              <div className="mt-5 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                <span>Updated</span>
                <span>{project.lastUpdated}</span>
              </div>
              <a href={`/projects/${project.id}`} className="mt-5 inline-flex text-sm font-medium text-blue-600 dark:text-blue-400">
                Open workspace →
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
