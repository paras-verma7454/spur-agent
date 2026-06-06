import { NextRequest, NextResponse } from 'next/server';
import { historyQuerySchema } from '@/lib/validations';
import { createDrizzleRepository } from '@/lib/repo';
import { db } from '@/lib/db';

const repo = createDrizzleRepository(db);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = historyQuerySchema.safeParse({
      sessionId: searchParams.get('sessionId'),
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || 'Invalid session ID' },
        { status: 400 }
      );
    }

    const { sessionId } = parsed.data;

    const [exists, messages] = await Promise.all([
      repo.conversationExists(sessionId),
      repo.getHistory(sessionId),
    ]);

    if (!exists) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to load conversation history' },
      { status: 500 }
    );
  }
}
