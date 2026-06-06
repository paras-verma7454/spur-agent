interface MessageBubbleProps {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export function MessageBubble({ sender, text, timestamp }: MessageBubbleProps) {
  const isUser = sender === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-2xl ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
