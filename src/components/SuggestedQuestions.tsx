interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void;
}

const QUESTIONS = [
  "What's your return policy?",
  "Do you ship internationally?",
  "What payment methods do you accept?",
];

export function SuggestedQuestions({ onQuestionClick }: SuggestedQuestionsProps) {
  return (
    <div className="px-4 pb-2">
      <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
      <div className="flex flex-wrap gap-2">
        {QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => onQuestionClick(question)}
            className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
