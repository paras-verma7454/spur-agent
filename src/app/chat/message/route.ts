import { NextRequest, NextResponse } from 'next/server';
import { chatMessageSchema } from '@/lib/validations';
import { conversationPipeline } from '@/lib/pipeline';
import { createDrizzleRepository } from '@/lib/repo';
import { createLLMProviderFromEnv } from '@/lib/llm-provider';
import { createInMemoryRateLimiter } from '@/lib/rate-limiter';
import { db } from '@/lib/db';

const MAX_BODY_SIZE = 10_240;

const repo = createDrizzleRepository(db);
const rateLimiter = createInMemoryRateLimiter();

let llm: ReturnType<typeof createLLMProviderFromEnv> | null = null;

function getLlm() {
  if (!llm) llm = createLLMProviderFromEnv();
  return llm;
}

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const result = await conversationPipeline(
      { repo, llm: getLlm(), rateLimiter },
      { message: parsed.data.message, sessionId: parsed.data.sessionId ?? undefined, ip }
    );

    if (!result.ok) {
      const headers: Record<string, string> = {};
      if (result.error.retryAfter) {
        headers['Retry-After'] = String(result.error.retryAfter);
      }
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.status, headers }
      );
    }

    return NextResponse.json(result.result);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Sorry, something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
