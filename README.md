# Spur AI Chat Agent

A mini AI support agent for a live chat widget, built as part of the Spur Software Engineer Hiring Assignment.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (NeonDB/Supabase)
- **ORM:** Drizzle ORM
- **LLM:** OpenAI GPT-4o-mini or Groq Llama 3.3 70B
- **Validation:** Zod
- **Styling:** Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 20.19+
- A PostgreSQL database (NeonDB, Supabase, or local)
- OpenAI or Groq API key

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd spur-chat-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env.local` and fill in your values:
   ```env
   DATABASE_URL="postgres://user:password@host:5432/dbname"
   
   # LLM Provider: "openai" or "groq"
   LLM_PROVIDER="groq"
   
   # OpenAI (used when LLM_PROVIDER=openai)
   OPENAI_API_KEY="sk-your-api-key"
   OPENAI_MODEL="gpt-4o-mini"
   
   # Groq (used when LLM_PROVIDER=groq)
   GROQ_API_KEY="gsk_your-groq-key"
   GROQ_MODEL="llama-3.3-70b-versatile"
   ```

4. **Set up database**
   ```bash
   npx drizzle-kit push
   ```

5. **Test database connection**
   ```bash
   npm run db:test
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

7. **Open in browser**
   ```
   http://localhost:3000
   ```

## Architecture

### Overview

This is a **Next.js monolith** using App Router API routes as the backend. The frontend and backend live in the same project. The architecture follows a **ports & adapters** pattern with clear seams between business logic, infrastructure, and presentation.

### File Structure

```
src/
├── app/
│   ├── page.tsx                  # Main chat page
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Tailwind styles
│   └── chat/
│       ├── message/route.ts        # POST /chat/message (thin HTTP adapter)
│       └── history/route.ts        # GET /chat/history
├── lib/
│   ├── types.ts                  # Shared types (Sender, Message, HistoryMessage)
│   ├── db.ts                     # Drizzle database client + factory
│   ├── schema.ts                 # Drizzle schema (tables)
│   ├── repo.ts                   # ConversationRepository interface + Drizzle adapter
│   ├── repo-in-memory.ts         # In-memory adapter (for tests)
│   ├── llm-provider.ts           # LlmProvider interface + OpenAI/Groq/Fake adapters
│   ├── rate-limiter.ts           # RateLimiter interface + InMemory/NoOp adapters
│   ├── pipeline.ts               # conversationPipeline (orchestrates all deps)
│   ├── validations.ts            # Zod request schemas
│   └── prompts.ts                # System prompt + FAQ
├── hooks/
│   └── useChat.ts                # Frontend state + API + localStorage
├── components/
│   ├── ChatWidget.tsx            # Main chat container (pure renderer)
│   ├── MessageList.tsx           # Scrollable messages
│   ├── MessageBubble.tsx         # Individual message
│   ├── ChatInput.tsx             # Input + send button
│   ├── TypingIndicator.tsx       # Loading state
│   └── SuggestedQuestions.tsx    # Quick action buttons
└── drizzle/                      # Drizzle migrations (generated)
```

### Dependency Graph

```
types.ts ←── shared across everything
    │
    ├── repo.ts (ConversationRepository interface)
    ├── llm-provider.ts (LlmProvider interface)
    ├── rate-limiter.ts (RateLimiter interface)
    │
    └── pipeline.ts (orchestrates all three)
           │
           └── route.ts (thin HTTP adapter)

useChat.ts (frontend state + API)
    │
    └── ChatWidget.tsx (pure renderer)
```

### Seams & Adapters

| Interface | Production Adapter | Test Adapter | Purpose |
|-----------|-------------------|--------------|---------|
| `ConversationRepository` | Drizzle + PostgreSQL | In-memory Map | Data persistence |
| `LlmProvider` | OpenAI / Groq SDK | Fake (canned responses) | LLM generation |
| `RateLimiter` | In-memory sliding window | NoOp (always allow) | Request throttling |

### Data Flow

1. User types message → `useChat` hook sends POST to `/chat/message`
2. HTTP adapter validates request (Zod + body size check)
3. `conversationPipeline` orchestrates:
   - Rate limiter checks IP
   - Repository finds/creates conversation
   - Repository persists user message
   - Repository fetches last 20 messages for context
   - LLM provider generates reply
   - Repository persists AI message
4. Response returned to frontend
5. `useChat` updates state, stores sessionId in localStorage

### Key Design Decisions

- **Ports & adapters:** All infrastructure (DB, LLM, rate limiting) behind interfaces with swappable adapters
- **Function-based pipeline:** `conversationPipeline` is a pure function, not a class — simple, composable, testable
- **Shared types:** `Sender`, `Message`, `HistoryMessage` defined once in `types.ts`, imported everywhere
- **Session persistence:** localStorage stores sessionId for conversation history across page reloads
- **Domain-restricted AI:** Agent only answers store-related questions, redirects off-topic queries
- **Prompt injection defense:** User input wrapped in `<<<USER_INPUT>>>` markers

## LLM Integration

### Providers

- **OpenAI GPT-4o-mini** — cost-effective, reliable (default for OpenAI)
- **Groq Llama 3.3 70B** — fast inference, free tier available (default for Groq)

### Configuration

Set `LLM_PROVIDER` in your environment to switch between providers:

| Provider | `LLM_PROVIDER` | API Key | Default Model |
|----------|----------------|---------|---------------|
| OpenAI | `openai` | `OPENAI_API_KEY` | `gpt-4o-mini` |
| Groq | `groq` | `GROQ_API_KEY` | `llama-3.3-70b-versatile` |

### Prompt Strategy
- System prompt defines "Spur Store" identity and FAQ knowledge
- Conversation history included for contextual replies
- Max 500 tokens per response for cost control
- Temperature 0.7 for balanced responses
- User input wrapped in delimiters to prevent prompt injection
- Agent refuses off-topic questions with a polite redirect

### Guardrails
- 30-second timeout on API calls
- Graceful error handling for rate limits (429), invalid keys (401), network issues
- User-friendly fallback messages
- Domain restriction: agent only answers store-related questions

## Security & Robustness

### Input Validation
- **Zod schemas** for all request bodies and query parameters
- **Empty messages** rejected with 400
- **Long messages** silently truncated to 2000 chars (server-side via Zod transform)
- **Invalid JSON** caught and returned as 400
- **Invalid UUID format** for sessionId rejected early

### Rate Limiting
- In-memory sliding window: 20 requests per minute per IP
- Returns 429 with `Retry-After` header when exceeded
- Pluggable interface — swap to Redis for multi-instance deployments

### Body Size Limit
- Requests over 10KB rejected with 413 before JSON parsing

### Error Handling
- Backend never crashes on bad input — all errors caught and returned as clean JSON
- LLM failures (timeout, rate limit, invalid key) return friendly messages, not stack traces
- Frontend displays contextual error messages based on HTTP status codes
- Graceful degradation: `conversationPipeline` returns structured errors, not exceptions

### Prompt Injection Defense
- User input wrapped in `<<<USER_INPUT>>>` / `<<<END_USER_INPUT>>>` markers
- System prompt instructs AI to never treat user input as instructions
- Agent refuses to answer non-store questions

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `LLM_PROVIDER` | No | `"openai"` or `"groq"` (default: `"openai"`) |
| `OPENAI_API_KEY` | If OpenAI | OpenAI API key |
| `OPENAI_MODEL` | No | OpenAI model (default: `gpt-4o-mini`) |
| `GROQ_API_KEY` | If Groq | Groq API key |
| `GROQ_MODEL` | No | Groq model (default: `llama-3.3-70b-versatile`) |

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npx drizzle-kit push` | Push schema to database |
| `npx drizzle-kit generate` | Generate migration files |
| `npx drizzle-kit studio` | Open Drizzle Studio |
| `npm run db:test` | Test database connection |

## Trade-offs & If I Had More Time

### Trade-offs Made
- **FAQ in prompt:** Simpler than vector search, sufficient for this scope
- **No auth:** Assignment says optional, keeping it simple
- **In-memory rate limiter:** Works for single-instance; Redis needed for production scale
- **Drizzle `any` type for DB:** Simplifies repository typing; proper generic would be stricter

### If I Had More Time
- [ ] Add conversation history sidebar
- [ ] Implement streaming responses for better UX
- [ ] Add dark mode support
- [ ] Switch rate limiter to Redis for multi-instance
- [ ] Add unit and integration tests (now possible with in-memory adapters)
- [ ] Deploy to Vercel/Render
- [ ] Add WebSocket for real-time updates
- [ ] Implement conversation search
- [ ] Add admin dashboard for analytics

## License

MIT
