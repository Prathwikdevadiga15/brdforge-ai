import { NextResponse } from "next/server";
import { projectSummaries } from "@/lib/mock-data";
import { db } from "@/lib/db";
import { createProjectSchema, validationMessage } from "@/lib/server/validation";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, mode: "demo", projects: projectSummaries, total: projectSummaries.length });
  }

  try {
    const projects = await db.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { sources: true, requirements: true } } },
    });
    return NextResponse.json({
      ok: true,
      mode: "database",
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        domain: project.domain,
        status: project.status,
        health: project.health,
        lastUpdated: project.updatedAt.toISOString(),
        owner: project.owner,
        sourceCount: project._count.sources,
        requirementCount: project._count.requirements,
      })),
      total: projects.length,
    });
  } catch (error) {
    console.error("Unable to list projects from the configured database.", error);
    return NextResponse.json({ ok: false, error: "Project storage is unavailable. Check DATABASE_URL and database migrations." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: validationMessage(parsed.error) }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: "Project creation needs PostgreSQL. Configure DATABASE_URL or continue in the browser-only demo." }, { status: 503 });
  }

  try {
    const project = await db.project.create({
      data: {
        ...parsed.data,
        status: "Draft",
        health: 0,
        versions: {
          create: { label: "v1.0", summary: "Project created.", impact: "No requirements or source documents yet." },
        },
        brdSections: {
          create: [
            { title: "Objective and scope", description: "Business outcome and boundaries.", content: "", position: 1 },
            { title: "Business requirements", description: "Validated functional and non-functional needs.", content: "", position: 2 },
            { title: "Assumptions and constraints", description: "Known assumptions and delivery boundaries.", content: "", position: 3 },
            { title: "Risks and open decisions", description: "Items requiring stakeholder review.", content: "", position: 4 },
          ],
        },
      },
    });
    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch (error) {
    console.error("Unable to create project in the configured database.", error);
    return NextResponse.json({ ok: false, error: "Project could not be saved. Check the database connection and try again." }, { status: 503 });
  }
}
