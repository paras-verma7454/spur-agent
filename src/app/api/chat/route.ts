import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, messages } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { generateReply } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim().slice(0, 2000);

    let conversation;
    if (sessionId && typeof sessionId === 'string') {
      const existing = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, sessionId))
        .limit(1);
      conversation = existing[0];
    }

    if (!conversation) {
      const created = await db.insert(conversations).values({}).returning();
      conversation = created[0];
    }

    await db.insert(messages).values({
      conversationId: conversation.id,
      sender: 'user',
      text: trimmedMessage,
    });

    const history = await db
      .select({ sender: messages.sender, text: messages.text })
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(asc(messages.timestamp))
      .limit(20);

    const reply = await generateReply(history, trimmedMessage);

    await db.insert(messages).values({
      conversationId: conversation.id,
      sender: 'ai',
      text: reply,
    });

    return NextResponse.json({ reply, sessionId: conversation.id });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Sorry, something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
