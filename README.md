# Spur AI Chat Agent

A mini AI support agent for a live chat widget, built as part of the Spur Software Engineer Hiring Assignment.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (NeonDB/Supabase)
- **ORM:** Drizzle ORM
- **LLM:** OpenAI GPT-4o-mini or Groq Llama 3.3 70B
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

This is a **Next.js monolith** using App Router API routes as the backend. The frontend and backend live in the same project, sharing types and utilities.

### File Structure

```
src/
├── app/
│   ├── page.tsx              # Main chat page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Tailwind styles
│   └── api/chat/
│       ├── route.ts          # POST /api/chat
│       └── history/route.ts  # GET /api/chat/history
├── lib/
│   ├── db.ts                 # Drizzle database client
│   ├── schema.ts             # Drizzle schema (tables)
│   ├── llm.ts                # OpenAI/Groq integration
│   └── prompts.ts            # System prompt + FAQ
├── components/
│   ├── ChatWidget.tsx        # Main chat container
│   ├── MessageList.tsx       # Scrollable messages
│   ├── MessageBubble.tsx     # Individual message
│   ├── ChatInput.tsx         # Input + send button
│   ├── TypingIndicator.tsx   # Loading state
│   └── SuggestedQuestions.tsx # Quick action buttons
└── drizzle/                  # Drizzle migrations (generated)
```

### Data Flow

1. User types message → Frontend sends POST to `/api/chat`
2. Backend validates input, creates/retrieves conversation
3. Saves user message to database
4. Fetches last 20 messages for context
5. Calls LLM (OpenAI or Groq) with system prompt + conversation history
6. Saves AI response to database
7. Returns response to frontend

### Key Design Decisions

- **Session persistence:** Uses localStorage to store sessionId, enabling conversation history across page reloads
- **Context window:** Limits to last 20 messages to control LLM costs
- **FAQ in prompt:** Store FAQ knowledge directly in the system prompt for simplicity
- **Error handling:** Graceful degradation with user-friendly error messages
- **Multi-LLM support:** Switch between OpenAI and Groq via environment variable

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

### Guardrails
- 30-second timeout on API calls
- Graceful error handling for rate limits, invalid keys, network issues
- User-friendly fallback messages

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
- **No Redis:** Not needed for this scale

### If I Had More Time
- [ ] Add conversation history sidebar
- [ ] Implement streaming responses for better UX
- [ ] Add dark mode support
- [ ] Implement rate limiting on API
- [ ] Add unit and integration tests
- [ ] Deploy to Vercel/Render
- [ ] Add WebSocket for real-time updates
- [ ] Implement conversation search
- [ ] Add admin dashboard for analytics

## License

MIT
