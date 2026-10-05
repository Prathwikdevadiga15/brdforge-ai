# Code Style

## Languages and frameworks

- TypeScript and TSX for the Next.js App Router application, API handlers, and React UI.
- CSS (Tailwind CSS v4 utilities plus `app/globals.css`) for styling.
- Prisma Schema Language for the PostgreSQL data model.
- SQL is managed through Prisma migrations; JSON is used for environment templates and API payloads.
- JavaScript (`.mjs`) is used for the Prisma seed script.

## Conventions

- Keep server-only code in `lib/server/` or API route handlers. Never import secrets or the database client into a client component.
- Use strict TypeScript; prefer explicit domain types from `lib/types.ts`.
- Validate all incoming API data with Zod before database writes.
- Keep API errors explicit and return an appropriate HTTP status. Do not turn failed writes into success-shaped demo responses.
- Use descriptive kebab-case route folders and PascalCase React component names.
- Prefer small, single-purpose components and service functions. Keep product copy clear about demo, heuristic, and AI modes.
- Use accessible labels for inputs and icon-only controls, keyboard-operable buttons, semantic headings, and reduced-motion support.
- Use the existing Geist typography, Lucide icon set, and neutral/violet BRDForge theme.
- Format with the repository's existing ESLint/TypeScript setup. No formatter is configured.

## Checks

```powershell
npm run lint
npx tsc --noEmit
npm run db:validate
npm run build
```
