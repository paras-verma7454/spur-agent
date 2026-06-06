import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, messages } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, sessionId))
      .limit(1);

    if (!conversation[0]) {
      return NextResponse.json({ messages: [] });
    }

    const chatMessages = await db
      .select({
        id: messages.id,
        sender: messages.sender,
        text: messages.text,
        timestamp: messages.timestamp,
      })
      .from(messages)
      .where(eq(messages.conversationId, sessionId))
      .orderBy(asc(messages.timestamp));

    return NextResponse.json({ messages: chatMessages });
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to load conversation history' },
      { status: 500 }
    );
  }
}
