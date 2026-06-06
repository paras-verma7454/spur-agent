'use client';

import { useState, useCallback, useRef, useEffect, useTransition, useDeferredValue } from 'react';
import type { Message } from '@/lib/types';

function getInitialSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('chatSessionId');
}

function getFriendlyError(status: number, serverError?: string): string {
  if (status === 429) {
    return 'You\'re sending messages too quickly. Please wait a moment and try again.';
  }
  if (status === 413) {
    return 'Your message is too long. Please keep it under 2000 characters.';
  }
  if (status === 400) {
    return serverError || 'Invalid message. Please try again.';
  }
  if (status >= 500) {
    return 'Sorry, our support system is having issues. Please try again in a moment.';
  }
  return 'Sorry, something went wrong. Please try again.';
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const sessionIdRef = useRef<string | null>(getInitialSessionId());
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasLoadedHistory = useRef(false);

  const showWelcome = messages.length === 0;

  const deferredMessages = useDeferredValue(messages);

  const loadHistory = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/chat/history?sessionId=${id}`);
      if (!res.ok) return;
      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) return;
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        startTransition(() => {
          setMessages(data.messages.map((m: Message) => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            timestamp: new Date(m.timestamp),
          })));
        });
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedHistory.current && sessionIdRef.current) {
      hasLoadedHistory.current = true;
      loadHistory(sessionIdRef.current);
    }
  }, [loadHistory]);

  const sendMessage = useCallback(async (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    startTransition(() => {
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
    });

    try {
      const res = await fetch('/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          ...(sessionIdRef.current ? { sessionId: sessionIdRef.current } : {}),
        }),
      });

      let data: { reply?: string; sessionId?: string; error?: string };
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await res.json();
      } else {
        data = {};
      }

      if (!res.ok) {
        throw new Error(getFriendlyError(res.status, data.error));
      }

      if (data.sessionId) {
        sessionIdRef.current = data.sessionId;
        localStorage.setItem('chatSessionId', data.sessionId);
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: data.reply || 'I apologize, but I could not generate a response. Please try again.',
        timestamp: new Date(),
      };
      startTransition(() => {
        setMessages((prev) => [...prev, aiMessage]);
      });
    } catch (error) {
      console.error('Chat error:', error);
      const errorText = error instanceof Error
        ? error.message
        : 'Sorry, something went wrong. Please try again.';
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: errorText,
        timestamp: new Date(),
      };
      startTransition(() => {
        setMessages((prev) => [...prev, errorMessage]);
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messages: deferredMessages, isLoading: isLoading || isPending, showWelcome, sendMessage };
}
