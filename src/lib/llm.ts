import OpenAI from 'openai';
import { SYSTEM_PROMPT } from './prompts';

const provider = process.env.LLM_PROVIDER || 'openai';

const openai = new OpenAI({
  apiKey: provider === 'groq' ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY,
  baseURL: provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined,
  timeout: 30000,
});

function getModel(): string {
  if (provider === 'groq') return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

interface HistoryMessage {
  sender: string;
  text: string;
}

export async function generateReply(
  history: HistoryMessage[],
  userMessage: string
): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((msg) => ({
      role: (msg.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.text,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: getModel(),
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 
      'I apologize, but I could not generate a response. Please try again.';
  } catch (error: unknown) {
    console.error('LLM error:', error);
    
    const err = error as { status?: number };
    
    if (err?.status === 429) {
      return 'I apologize, but our support system is currently busy. Please try again in a moment.';
    }
    if (err?.status === 401) {
      return 'I apologize, but there is a configuration issue with our support system.';
    }
    return 'I apologize, but I am having trouble connecting to our support system. Please try again in a moment.';
  }
}
