'use client';

import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { SuggestedQuestions } from './SuggestedQuestions';
import { useChat } from '@/hooks/useChat';

const ChatHeader = (
  <div className="px-4 py-3 bg-blue-600 text-white rounded-t-lg">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 bg-green-400 rounded-full" />
      <h2 className="font-semibold">Spur Store Support</h2>
    </div>
    <p className="text-xs text-blue-100 mt-0.5">We typically reply instantly</p>
  </div>
);

export function ChatWidget() {
  const { messages, isLoading, showWelcome, sendMessage } = useChat();

  return (
    <div className="flex flex-col h-[600px] w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200">
      {ChatHeader}

      <MessageList messages={messages} />

      {showWelcome ? (
        <div className="px-4 py-3">
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-700">
              Hi! 👋 I&apos;m the Spur Store support agent. How can I help you today?
            </p>
          </div>
          <SuggestedQuestions onQuestionClick={sendMessage} />
        </div>
      ) : null}

      {isLoading ? (
        <div className="px-4">
          <TypingIndicator />
        </div>
      ) : null}

      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
