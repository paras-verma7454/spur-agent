import { neonConfig, neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { conversations, messages } from './schema';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 300;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const nativeFetch = globalThis.fetch;

neonConfig.fetchFunction = async function retryFetch(
  url: string | URL,
  init?: RequestInit
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await nativeFetch(url, init);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`[DB RETRY] Fetch attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw lastError;
};

function createDb(url?: string) {
  const sql = neon(url || process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { conversations, messages } });
}

export const db = createDb();

async function warmUp() {
  try {
    await db.select({ id: conversations.id }).from(conversations).limit(1);
    console.log('[DB] Warm-up ping succeeded');
  } catch {
    console.warn('[DB] Warm-up ping failed (will retry on first real query)');
  }
}

warmUp();
