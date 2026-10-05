# BRDForge AI

**Fragmented inputs in. Evidence-backed BRDs out.**

BRDForge AI is a Next.js/TypeScript MVP for turning business sources into reviewable, evidence-linked requirements and a versioned BRD. The demo showcases multimodal product concepts; the implemented ingestion endpoint currently accepts UTF-8 text sources only.

## Run locally

Requirements: Node.js 20+, npm, and Docker (for the quick PostgreSQL setup) or PostgreSQL 14+.

```powershell
cd C:\path\to\brdforge-ai
npm install
Copy-Item .env.example .env
npm run dev
```

With `DATABASE_URL` blank, the application uses read-only demo mode. For a persistent local database, start PostgreSQL and set `DATABASE_URL` in `.env` to `postgresql://brdforge:brdforge_local@localhost:5432/brdforge?schema=public`, then apply the migration:

```powershell
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

`db:seed` creates the Atlas Ops Hub sample project and is safe to re-run. To enable AI extraction, set `OPENAI_API_KEY` and optionally `OPENAI_BASE_URL` and `OPENAI_MODEL`. With no key, text ingestion uses the explicitly labeled keyword heuristic.

Docker is optional. If it is not installed, use a PostgreSQL database from Supabase or Neon and set its connection URL in `.env` instead.

Visit `http://localhost:3000`. In deployment, set `DATABASE_URL`, run `npm run db:deploy`, then optionally configure the AI provider.

## Features in this MVP

- Responsive product landing page and dashboard.
- Demo portfolio, requirement ledger, conflict summaries, version history and BRD sections.
- Project listing/creation API with database persistence when configured.
- Project detail API and source ingestion for TXT, Markdown, CSV and JSON (100 KB cap).
- Evidence-linked candidate requirements, version records, AI/heuristic mode reporting, and health/config endpoint.
- Explainable requirement-intelligence score, deterministic risk/quality signals, project knowledge graph, stakeholder summaries, scope estimate, Eco estimate, and executive view.
- Project-scoped text search, exact-line source comparison, evidence review actions, acceptance-criteria storage, and test-case API.
- Database-backed source-processing job/stage events and minimal audit events for source-ingestion and review decisions.
- PostgreSQL schema and seed project.

## Important limitations

This is a hackathon MVP, not production-ready. There is no login or authorization; do not expose write endpoints publicly or upload confidential data. The frontend project-creation flow is browser-session only in demo mode; persisted writes are available through the API when PostgreSQL is configured. PDF/DOCX/image extraction, live Cloudinary uploads, Supabase Auth, Meilisearch integration, Redis caching, pgvector retrieval, Razorpay, distributed job processing and complete audit coverage are not implemented. Risk and quality scores are deterministic review indicators, eco values are estimates, and historical scope comparison is inferred without version snapshots. See [security.md](./security.md), [architecture.md](./architecture.md), [api.guide.md](./api.guide.md), and [code style.md](./code%20style.md).

See [FILE_STRUCTURE.md](./FILE_STRUCTURE.md) for the source tree and language inventory.

## Useful commands

```powershell
npm run lint
npx tsc --noEmit
npm run db:validate
npm run build
```
