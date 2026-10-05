# Architecture

## Overview

BRDForge AI is a TypeScript full-stack MVP implemented as one Next.js App Router deployment. It does not have a separate Python/FastAPI service. Server-rendered product pages and client-side workspace interactions call typed Next.js Route Handlers. Prisma is the persistence boundary for PostgreSQL.

```text
Browser (Next.js / React / Tailwind)
          |
          | same-origin JSON + multipart API
          v
Next.js Route Handlers ---- Zod validation
          |                       |
          +---- extraction service (OpenAI-compatible API or labeled heuristic)
          |
          v
Prisma Client ---- PostgreSQL (Supabase or Neon)
```

## Core flow

1. Project creation initializes metadata, a first version, and four BRD sections.
2. A UTF-8 text source is validated by MIME type and byte length.
3. The extraction service uses OpenAI-compatible structured JSON output when `OPENAI_API_KEY` is set. Otherwise, explicit requirement keywords produce low-confidence candidates; the mode is returned as `heuristic`.
4. Candidates are persisted with their source evidence and a version record. Candidates remain in `review`; the system never auto-approves or resolves contradictions. A database-backed processing job tracks preprocessing, extraction, persistence, and version creation; failures are recorded with sanitized messages.
5. Project reads return requirements, evidence, conflicts, versions, source metadata, impact records and BRD sections.
6. Project-intelligence functions calculate explainable scores and risk signals from those records. Eco outputs are application-efficiency estimates; search is project-scoped and currently filters loaded records rather than querying Meilisearch or pgvector.

## Data model

`Project` owns `Requirement`, `Conflict`, `Evidence`, `Source`, `Version`, `Impact`, `AuditEvent`, and ordered `BrdSection` records. `Evidence` may reference both its uploaded `Source` and a `Requirement`. Processing jobs/events record source-ingestion stages; this is not a distributed queue or a full five-agent pipeline. See `prisma/schema.prisma`.

## Current limitations

The landing/dashboard still includes demo-seeded summaries. PostgreSQL-backed project APIs require database setup; demo mode is intentionally read-only on the server. PDF, DOCX and image extraction, vector search, auth, payment, external storage, a distributed processing queue and complete audit event coverage are not wired despite SDK dependencies being present. Historical scope is inferred rather than based on saved version snapshots. Health checks report configuration, not remote service availability.

## Deployment

Deploy the Next.js app to Vercel (or any Node.js host), set `DATABASE_URL`, apply Prisma migrations with `npm run db:deploy`, and optionally configure the AI provider. Do not enable public access until the auth and authorization requirements in [security.md](./security.md) are met.
