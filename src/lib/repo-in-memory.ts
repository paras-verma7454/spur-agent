import type { ConversationRepository } from './repo';
import type { Sender } from './types';

interface StoredMessage {
  id: string;
  conversationId: string;
  sender: Sender;
  text: string;
  timestamp: Date;
}

export function createInMemoryRepository(): ConversationRepository & {
  _reset(): void;
  _getMessages(): StoredMessage[];
} {
  const conversations = new Map<string, { id: string; createdAt: Date }>();
  const allMessages: StoredMessage[] = [];
  let idCounter = 0;

  function nextId(): string {
    idCounter++;
    return `test-${idCounter}`;
  }

  return {
    _reset() {
      conversations.clear();
      allMessages.length = 0;
      idCounter = 0;
    },

    _getMessages() {
      return [...allMessages];
    },

    async findOrCreateConversation(id?: string) {
      if (id) {
        const existing = conversations.get(id);
        if (existing) return existing;
      }
      const newId = id || nextId();
      const conv = { id: newId, createdAt: new Date() };
      conversations.set(newId, conv);
      return conv;
    },

    async addMessage(conversationId: string, sender: Sender, text: string) {
      allMessages.push({
        id: nextId(),
        conversationId,
        sender,
        text,
        timestamp: new Date(),
      });
    },

    async getHistory(conversationId: string, limit = 20) {
      return allMessages
        .filter((m) => m.conversationId === conversationId)
        .toSorted((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(0, limit)
        .map((m) => ({ id: m.id, sender: m.sender, text: m.text, timestamp: m.timestamp }));
    },

    async conversationExists(id: string) {
      return conversations.has(id);
    },
  };
}
