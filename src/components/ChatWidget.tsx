'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { SuggestedQuestions } from './SuggestedQuestions';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

function getInitialSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('chatSessionId');
}

export function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(getInitialSessionId);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const hasLoadedHistory = useRef(false);

  const loadHistory = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/history?sessionId=${id}`);
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages.map((m: Message) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })));
        setShowWelcome(false);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedHistory.current && sessionId) {
      hasLoadedHistory.current = true;
      loadHistory(sessionId);
    }
  }, [sessionId, loadHistory]);

  const sendMessage = useCallback(async (text: string) => {
    setShowWelcome(false);
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSessionId(data.sessionId);
      localStorage.setItem('chatSessionId', data.sessionId);

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return (
    <div className="flex flex-col h-[600px] w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full" />
          <h2 className="font-semibold">Spur Store Support</h2>
        </div>
        <p className="text-xs text-blue-100 mt-0.5">We typically reply instantly</p>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Welcome & Suggested Questions */}
      {showWelcome && messages.length === 0 && (
        <div className="px-4 py-3">
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-700">
              Hi! 👋 I&apos;m the Spur Store support agent. How can I help you today?
            </p>
          </div>
          <SuggestedQuestions onQuestionClick={sendMessage} />
        </div>
      )}

      {/* Typing Indicator */}
      {isLoading && (
        <div className="px-4">
          <TypingIndicator />
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
