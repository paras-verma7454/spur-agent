import { eq, asc } from 'drizzle-orm';
import { conversations, messages } from './schema';
import type { Sender, HistoryMessage } from './types';

export interface ConversationRepository {
  findOrCreateConversation(id?: string): Promise<{ id: string }>;
  addMessage(conversationId: string, sender: Sender, text: string): Promise<void>;
  getHistory(conversationId: string, limit?: number): Promise<HistoryMessage[]>;
  conversationExists(id: string): Promise<boolean>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDB = any;

function logDbError(operation: string, err: unknown) {
  console.error(`[DB ERROR] ${operation}:`, err);

  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>;

    // drizzle wraps neon error in .cause
    const cause = obj.cause;
    if (cause) {
      console.error(`[DB CAUSED_BY] ${operation}:`, cause);

      if (cause && typeof cause === 'object') {
        const inner = cause as Record<string, unknown>;

        if (inner.sourceError) {
          console.error(`[DB SOURCE_ERROR] ${operation}:`, inner.sourceError);
        }

        // AggregateError has .errors array
        const innerCause = inner.cause;
        if (innerCause instanceof AggregateError) {
          console.error(`[DB AGGREGATE_ERRORS] ${operation}:`, innerCause.errors);
          for (const e of innerCause.errors) {
            console.error(`  [DB ROOT_ERROR] ${operation}:`, e?.message, e?.code);
          }
        } else if (innerCause) {
          console.error(`[DB INNER_CAUSE] ${operation}:`, innerCause);
        }
      }
    }

    // some errors put sourceError directly
    if (obj.sourceError) {
      console.error(`[DB SOURCE_ERROR] ${operation}:`, obj.sourceError);
    }
  }
}

export function createDrizzleRepository(db: DrizzleDB): ConversationRepository {
  return {
    async findOrCreateConversation(id?: string) {
      if (id) {
        try {
          const existing = await db
            .select()
            .from(conversations)
            .where(eq(conversations.id, id))
            .limit(1);
          if (existing[0]) return existing[0];
        } catch (err) {
          logDbError('findOrCreateConversation.select', err);
          throw err;
        }
      }

      try {
        const created = await db.insert(conversations).values({}).returning();
        return created[0];
      } catch (err) {
        logDbError('findOrCreateConversation.insert', err);
        throw err;
      }
    },

    async addMessage(conversationId: string, sender: Sender, text: string) {
      try {
        await db.insert(messages).values({
          conversationId,
          sender,
          text,
        });
      } catch (err) {
        logDbError(`addMessage(${sender})`, err);
        throw err;
      }
    },

    async getHistory(conversationId: string, limit = 20) {
      try {
        const rows = await db
          .select({ id: messages.id, sender: messages.sender, text: messages.text })
          .from(messages)
          .where(eq(messages.conversationId, conversationId))
          .orderBy(asc(messages.timestamp))
          .limit(limit);
        return rows as HistoryMessage[];
      } catch (err) {
        logDbError('getHistory', err);
        throw err;
      }
    },

    async conversationExists(id: string) {
      try {
        const result = await db
          .select({ id: conversations.id })
          .from(conversations)
          .where(eq(conversations.id, id))
          .limit(1);
        return result.length > 0;
      } catch (err) {
        logDbError('conversationExists', err);
        throw err;
      }
    },
  };
}
