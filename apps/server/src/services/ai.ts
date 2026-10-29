import type {
  AiCompleteRequest,
  AiCompleteResponse,
  IntegrationProvider,
} from '@ish-maydoni/shared';
import { httpError } from '../errors.js';
import { signRequest } from './integrations.js';
import type { HttpClient } from './ssrf.js';

const fill = (tpl: string, fields: Record<string, string>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k: string) => fields[k] ?? '');

type Json = Record<string, any>;

/**
 * One call shape for every AI provider ("dialect" per provider in the shared catalog):
 * anthropic → /v1/messages, openai (OpenAI, Mistral, OpenRouter, own server) → /chat/completions, gemini → generateContent.
 */
export async function completeWith(
  http: HttpClient,
  provider: IntegrationProvider,
  fields: Record<string, string>,
  req: AiCompleteRequest,
): Promise<AiCompleteResponse> {
  const ai = provider.ai;
  if (!ai) throw httpError(400, 'validation', 'Bu xizmat sunʼiy intellekt emas');
  const base = fill(ai.baseUrl, fields).replace(/\/+$/, '');
  const model = req.model?.trim() || fill(ai.defaultModel, fields);
  const maxTokens = req.maxTokens ?? 1024;

  let url: string;
  let body: Json;
  if (ai.dialect === 'anthropic') {
    url = `${base}/v1/messages`;
    body = { model, max_tokens: maxTokens, messages: req.messages };
    if (req.system) body.system = req.system;
  } else if (ai.dialect === 'openai') {
    url = `${base}/chat/completions`;
    body = {
      model,
      max_tokens: maxTokens,
      messages: [...(req.system ? [{ role: 'system', content: req.system }] : []), ...req.messages],
    };
  } else {
    url = `${base}/models/${encodeURIComponent(model)}:generateContent`;
    body = {
      contents: req.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: maxTokens },
    };
    if (req.system) body.systemInstruction = { parts: [{ text: req.system }] };
  }

  let res;
  try {
    res = await http({
      ...signRequest(provider, fields, { method: 'POST', url, body: JSON.stringify(body) }),
      timeoutMs: 60_000,
    });
  } catch {
    throw httpError(502, 'ai_unreachable', 'Sunʼiy intellekt xizmatiga ulanib boʻlmadi');
  }
  if (res.status === 401 || res.status === 403) {
    throw httpError(
      502,
      'ai_rejected',
      'Sunʼiy intellekt xizmati kalitni qabul qilmadi. Administrator kalitni tekshirsin',
    );
  }
  if (res.status === 429)
    throw httpError(
      503,
      'ai_busy',
      'Sunʼiy intellekt xizmati band yoki limit tugagan. Birozdan soʻng urining',
    );
  if (res.status < 200 || res.status >= 300) {
    throw httpError(502, 'ai_error', `Sunʼiy intellekt xizmati xato qaytardi (${res.status})`);
  }

  let json: Json;
  try {
    json = JSON.parse(res.text);
  } catch {
    throw httpError(502, 'ai_error', 'Sunʼiy intellekt xizmati tushunarsiz javob berdi');
  }
  const text =
    ai.dialect === 'anthropic'
      ? (json.content ?? [])
          .filter((c: Json) => c.type === 'text')
          .map((c: Json) => c.text)
          .join('')
      : ai.dialect === 'openai'
        ? (json.choices?.[0]?.message?.content ?? '')
        : (json.candidates?.[0]?.content?.parts ?? []).map((p: Json) => p.text ?? '').join('');
  return { provider: provider.key, model, text: String(text) };
}
