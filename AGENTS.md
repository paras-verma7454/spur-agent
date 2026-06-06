<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Spur Chat Agent

Customer support chat widget for Spur Store, built with Next.js 16 + Neon + Drizzle.

## Tech Stack

- **Framework:** Next.js 16.2.7 (Turbopack)
- **React:** 19.2.4
- **Database:** Neon PostgreSQL (serverless HTTP driver `@neondatabase/serverless`)
- **ORM:** Drizzle ORM
- **Validation:** Zod
- **Styling:** Tailwind CSS v4
- **LLM:** OpenAI / Groq

## Project Structure

```
src/
  app/          # Next.js App Router (API routes + pages)
  components/   # React UI components (ChatWidget, MessageList, ChatInput, etc.)
  hooks/        # Custom React hooks (useChat)
  lib/          # Core logic (db, repo, pipeline, llm-provider, types, schema)
```

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npx tsc --noEmit     # Type check
npm run lint         # ESLint
npm run db:push      # Push schema to Neon
npm run db:generate  # Generate Drizzle migrations
```

**Run type check and lint after every code change.**

## Database

- Schema: `src/lib/schema.ts` (conversations, messages tables)
- Connection: `src/lib/db.ts` (Neon HTTP with retry wrapper)
- Repository: `src/lib/repo.ts` (query functions with error logging)
- In-memory repo: `src/lib/repo-in-memory.ts` (for tests)

## Key Patterns

- API routes return JSON; errors use `NextResponse.json({ error }, { status })`
- All DB calls go through `src/lib/repo.ts` — never query `db` directly in routes
- Neon fetch retries are handled at the library level via `neonConfig.fetchFunction`
- Session IDs are UUIDs stored in `localStorage` as `chatSessionId`
- LLM providers implement `LlmProvider` interface (`generate(history, userMessage)`)
