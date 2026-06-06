import type { ConversationRepository } from './repo';
import type { LlmProvider } from './llm-provider';
import type { RateLimiter } from './rate-limiter';

export interface PipelineDeps {
  repo: ConversationRepository;
  llm: LlmProvider;
  rateLimiter: RateLimiter;
}

export interface PipelineParams {
  message: string;
  sessionId?: string;
  ip: string;
}

export interface PipelineResult {
  reply: string;
  sessionId: string;
}

export interface PipelineError {
  type: 'rate_limit' | 'validation' | 'internal';
  message: string;
  status: number;
  retryAfter?: number;
}

export async function conversationPipeline(
  deps: PipelineDeps,
  params: PipelineParams
): Promise<{ ok: true; result: PipelineResult } | { ok: false; error: PipelineError }> {
  const rateLimit = deps.rateLimiter.check(params.ip);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: {
        type: 'rate_limit',
        message: 'Too many requests. Please slow down.',
        status: 429,
        retryAfter: rateLimit.retryAfter,
      },
    };
  }

  const conversation = await deps.repo.findOrCreateConversation(params.sessionId);

  await deps.repo.addMessage(conversation.id, 'user', params.message);

  const history = await deps.repo.getHistory(conversation.id, 20);

  const reply = await deps.llm.generate(history, params.message);

  try {
    await deps.repo.addMessage(conversation.id, 'ai', reply);
  } catch (err) {
    console.error('Failed to persist AI reply:', err);
  }

  return {
    ok: true,
    result: { reply, sessionId: conversation.id },
  };
}
