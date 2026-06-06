const DELAY_0 = { animationDelay: '0ms' } as const;
const DELAY_150 = { animationDelay: '150ms' } as const;
const DELAY_300 = { animationDelay: '300ms' } as const;

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={DELAY_0} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={DELAY_150} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={DELAY_300} />
        </div>
      </div>
    </div>
  );
}
