'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          sender={message.sender as 'user' | 'ai'}
          text={message.text}
          timestamp={message.timestamp}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
