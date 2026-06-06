import OpenAI from 'openai';
import { SYSTEM_PROMPT } from './prompts';
import type { HistoryMessage } from './types';

export interface LlmProvider {
  generate(history: HistoryMessage[], userMessage: string): Promise<string>;
}

export interface OpenAIProviderConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export function createOpenAIProvider(config: OpenAIProviderConfig = {}): LlmProvider {
  const client = new OpenAI({
    apiKey: config.apiKey || process.env.OPENAI_API_KEY,
    timeout: config.timeout || 30000,
  });
  const model = config.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  return {
    async generate(history, userMessage) {
      try {
        const wrappedMessage = `<<<USER_INPUT>>>\n${userMessage}\n<<<END_USER_INPUT>>>`;
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.map((msg) => ({
            role: (msg.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: msg.text,
          })),
          { role: 'user', content: wrappedMessage },
        ];

        const completion = await client.chat.completions.create({
          model,
          messages,
          max_tokens: config.maxTokens || 500,
          temperature: config.temperature || 0.7,
        });

        const reply = completion.choices[0]?.message?.content;
        if (!reply || reply.trim().length === 0) {
          return 'I apologize, but I could not generate a response. Please try again.';
        }
        return reply;
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
    },
  };
}

export interface GroqProviderConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export function createGroqProvider(config: GroqProviderConfig = {}): LlmProvider {
  const client = new OpenAI({
    apiKey: config.apiKey || process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
    timeout: config.timeout || 30000,
  });
  const model = config.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  return {
    async generate(history, userMessage) {
      try {
        const wrappedMessage = `<<<USER_INPUT>>>\n${userMessage}\n<<<END_USER_INPUT>>>`;
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.map((msg) => ({
            role: (msg.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: msg.text,
          })),
          { role: 'user', content: wrappedMessage },
        ];

        const completion = await client.chat.completions.create({
          model,
          messages,
          max_tokens: config.maxTokens || 500,
          temperature: config.temperature || 0.7,
        });

        const reply = completion.choices[0]?.message?.content;
        if (!reply || reply.trim().length === 0) {
          return 'I apologize, but I could not generate a response. Please try again.';
        }
        return reply;
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
    },
  };
}

export function createFakeProvider(
  responses: string[] = ['Hello! How can I help you with your Spur Store order today?']
): LlmProvider {
  let callCount = 0;
  return {
    async generate() {
      const response = responses[callCount % responses.length];
      callCount++;
      return response;
    },
  };
}

export function createLLMProviderFromEnv(): LlmProvider {
  const provider = process.env.LLM_PROVIDER || 'openai';
  if (provider === 'groq') return createGroqProvider();
  return createOpenAIProvider();
}
