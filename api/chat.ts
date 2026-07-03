// Vercel Edge Function — server-side proxy for OpenAI.
//
// The app POSTs { messages } here; this function attaches the secret key and
// forwards to OpenAI, so the key NEVER ships inside the mobile bundle.
//
// Deploy:
//   1. Install the Vercel CLI:  npm i -g vercel
//   2. From the repo root:      vercel        (first run links/creates a project)
//   3. Set the secret:          vercel env add OPENAI_API_KEY   (paste your sk-... key)
//   4. Deploy to prod:          vercel --prod
//   5. Put the resulting URL in the app's .env as EXPO_PUBLIC_API_URL
//      (e.g. https://your-project.vercel.app)
//
// Uses the Edge runtime, so only standard Web APIs (Request/Response/fetch) —
// no extra npm dependencies required.

export const config = { runtime: 'edge' };

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = 'gpt-4o-mini';
const MAX_MESSAGES = 60; // matches the client's rolling history cap + system prompt

interface IncomingMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Allow calls from Expo web / any client. Tighten to your domain if desired.
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function isValidMessage(m: unknown): m is IncomingMessage {
  if (!m || typeof m !== 'object') return false;
  const msg = m as Record<string, unknown>;
  return (
    (msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant') &&
    typeof msg.content === 'string' &&
    msg.content.length <= 4000
  );
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return json({}, 204);
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!OPENAI_API_KEY) {
    return json({ error: 'Server is not configured. Missing OPENAI_API_KEY.' }, 500);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const messages = (payload as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'A non-empty "messages" array is required.' }, 400);
  }
  if (messages.length > MAX_MESSAGES) {
    return json({ error: 'Too many messages.' }, 400);
  }
  if (!messages.every(isValidMessage)) {
    return json({ error: 'Malformed message in "messages".' }, 400);
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 300, messages }),
    });

    if (!upstream.ok) {
      // Don't leak upstream error internals to the client.
      return json({ error: 'The AI service is unavailable right now.' }, 502);
    }

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content ?? '';
    return json({ reply }, 200);
  } catch {
    return json({ error: 'Could not reach the AI service.' }, 502);
  }
}
