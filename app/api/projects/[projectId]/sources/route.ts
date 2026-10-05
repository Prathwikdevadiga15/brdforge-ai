import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractRequirements } from "@/lib/server/extractor";
import { ingestTextSchema, validationMessage } from "@/lib/server/validation";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 100_000;
const ALLOWED_TYPES = new Set(["text/plain", "text/markdown", "text/csv", "application/json"]);

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: "Source ingestion requires configured PostgreSQL. The demo workspace does not store uploaded files." }, { status: 503 });
  }

  let form: FormData;
  let processingJobId: string | undefined;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Upload must use multipart/form-data." }, { status: 400 });
  }

  const file = form.get("file");
  const type = form.get("type");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Provide a source file in the 'file' field." }, { status: 400 });
  if (file.size < 1 || file.size > MAX_FILE_SIZE) return NextResponse.json({ ok: false, error: "Text source must be between 1 byte and 100 KB." }, { status: 413 });
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ ok: false, error: "This MVP accepts UTF-8 TXT, Markdown, CSV, and JSON. PDF, DOCX, and image parsing need a document-extraction provider." }, { status: 415 });
  }

  const parsed = ingestTextSchema.safeParse({
    filename: file.name,
    content: await file.text(),
    type: typeof type === "string" ? type : "document",
  });
  if (!parsed.success) return NextResponse.json({ ok: false, error: validationMessage(parsed.error) }, { status: 400 });

  try {
    const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) return NextResponse.json({ ok: false, error: "Project not found." }, { status: 404 });
    const job = await db.processingJob.create({
      data: {
        projectId,
        status: "processing",
        currentStage: "PREPROCESS",
        startedAt: new Date(),
        events: { create: { stage: "PREPROCESS", status: "completed", detail: `Validated UTF-8 ${file.type} input (${file.size} bytes).`, completedAt: new Date() } },
      },
    });
    processingJobId = job.id;
    await db.processingJob.update({ where: { id: job.id }, data: { currentStage: "EXTRACT" } });
    const extractionStartedAt = new Date();
    const extraction = await extractRequirements(parsed.data.content);
    await db.processingEvent.create({
      data: { jobId: job.id, stage: "EXTRACT", status: "completed", detail: `Generated ${extraction.requirements.length} candidate(s) using ${extraction.mode} mode.`, startedAt: extractionStartedAt, completedAt: new Date() },
    });
    const result = await db.$transaction(async (tx) => {
      await tx.processingJob.update({ where: { id: job.id }, data: { currentStage: "PERSIST" } });
      const source = await tx.source.create({
        data: {
          projectId,
          filename: parsed.data.filename,
          mimeType: file.type,
          type: parsed.data.type,
          extractedText: parsed.data.content,
          status: "processed",
        },
      });
      const created = [];
      for (const candidate of extraction.requirements) {
        created.push(await tx.requirement.create({
          data: {
            projectId,
            title: candidate.title,
            category: candidate.category,
            owner: "Unassigned",
            status: "review",
            confidence: candidate.confidence,
            summary: candidate.summary,
            rationale: extraction.mode === "ai"
              ? "Extracted from the uploaded source by the configured AI provider. Verify against the linked excerpt."
              : "Candidate matched a requirement keyword in the source. Human review is required; this is not an AI extraction.",
            evidenceIds: [],
            evidence: {
              create: {
                projectId,
                title: parsed.data.filename,
                type: parsed.data.type,
                source: parsed.data.filename,
                confidence: candidate.confidence,
                excerpt: candidate.summary,
                uploadedSourceId: source.id,
              },
            },
          },
        }));
      }
      const versionCount = await tx.version.count({ where: { projectId } });
      const version = await tx.version.create({
        data: {
          projectId,
          label: `v${versionCount + 1}.0`,
          summary: `Ingested ${parsed.data.filename}; extracted ${created.length} candidate requirement(s).`,
          impact: "New source and candidate requirements require stakeholder review.",
        },
      });
      await tx.processingEvent.createMany({
        data: [
          { jobId: job.id, stage: "PERSIST", status: "completed", detail: `Saved ${created.length} requirement(s) and evidence links.`, completedAt: new Date() },
          { jobId: job.id, stage: "VERSION", status: "completed", detail: `Created ${version.label}.`, completedAt: new Date() },
        ],
      });
      await tx.auditEvent.create({
        data: {
          projectId,
          action: "SOURCE_INGESTED",
          entity: "source",
          entityId: source.id,
          metadata: { filename: source.filename, requirementCount: created.length, extractionMode: extraction.mode },
        },
      });
      await tx.processingJob.update({ where: { id: job.id }, data: { status: "completed", currentStage: "COMPLETE", completedAt: new Date() } });
      return { source, created, version };
    });
    return NextResponse.json({
      ok: true,
      source: { id: result.source.id, filename: result.source.filename, status: result.source.status },
      extractionMode: extraction.mode,
      requirements: result.created,
      version: result.version,
    }, { status: 201 });
  } catch (error) {
    console.error("Source ingestion failed.", error);
    if (processingJobId) {
      try {
        await db.$transaction([
          db.processingJob.update({
            where: { id: processingJobId },
            data: { status: "failed", currentStage: "FAILED", error: "Source processing failed.", retryCount: { increment: 1 } },
          }),
          db.processingEvent.create({
            data: { jobId: processingJobId, stage: "FAILED", status: "failed", detail: "Source processing failed.", error: "See server log for diagnostic.", retryCount: 1 },
          }),
          db.auditEvent.create({
            data: { projectId, action: "SOURCE_INGESTION_FAILED", entity: "processing_job", entityId: processingJobId, metadata: { reason: "Processing failed; see server logs for a sanitized diagnostic." } },
          }),
        ]);
      } catch (trackingError) {
        console.error("Could not update the failed ingestion job state.", trackingError);
      }
    }
    return NextResponse.json({ ok: false, error: "Source could not be processed. Check database and AI provider configuration." }, { status: 503 });
  }
}
