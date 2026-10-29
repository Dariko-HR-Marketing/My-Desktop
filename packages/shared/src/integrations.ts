/**
 * Catalog of external services the workspace can connect to (AI models, messengers, work tools, generic REST/webhook).
 * It is plain data so the server (validation, connection tests) and the desktop (forms) share one source of truth.
 * Secrets are entered once, stored encrypted on the server and never sent back (only a short hint is).
 */
export type IntegrationCategory = 'ai' | 'messenger' | 'work' | 'gov' | 'custom';

/** `org` = one connection for the whole organisation (administrator manages it); `user` = each employee connects their own. */
export type IntegrationScope = 'org' | 'user';

export interface IntegrationField {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  placeholder?: string;
  help?: string;
  /** Value must be a public https:// address (checked on the server, SSRF-safe). */
  url?: boolean;
  /** Pre-filled non-secret value. */
  defaultValue?: string;
}

/** How the server proves the stored credentials work (`test`) and how a request is signed (`auth`). */
export type IntegrationAuth =
  | {
      kind: 'header';
      /** may be a `{field}` placeholder */ header: string;
      prefix?: string;
      field: string;
      extra?: Record<string, string>;
    }
  | { kind: 'bearer'; field: string; extra?: Record<string, string> }
  | { kind: 'urlToken'; field: string }
  | { kind: 'none' };

export interface IntegrationProvider {
  key: string;
  name: string;
  category: IntegrationCategory;
  scope: IntegrationScope;
  description: string;
  docsUrl: string;
  fields: IntegrationField[];
  auth: IntegrationAuth;
  /** Read-only endpoint used by "Tekshirish". `{field}` placeholders are replaced with the stored values. */
  test: { method: 'GET' | 'POST'; url: string; expect?: 'ok' } | null;
  /** AI providers speak one of these dialects through the universal /api/ai/complete gateway. */
  ai?: { dialect: 'anthropic' | 'openai' | 'gemini'; baseUrl: string; defaultModel: string };
}

const apiKey = (label = 'API kalit', help?: string): IntegrationField => ({
  key: 'apiKey',
  label,
  secret: true,
  required: true,
  help,
});

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  {
    key: 'anthropic',
    name: 'Anthropic (Claude)',
    category: 'ai',
    scope: 'org',
    description: 'Claude modellari: matn yozish, qisqartirish, tarjima, tahlil.',
    docsUrl: 'https://docs.anthropic.com/en/api/getting-started',
    fields: [apiKey('API kalit', 'console.anthropic.com → API Keys')],
    auth: {
      kind: 'header',
      header: 'x-api-key',
      field: 'apiKey',
      extra: { 'anthropic-version': '2023-06-01' },
    },
    test: { method: 'GET', url: 'https://api.anthropic.com/v1/models?limit=1' },
    ai: {
      dialect: 'anthropic',
      baseUrl: 'https://api.anthropic.com',
      defaultModel: 'claude-sonnet-5-5',
    },
  },
  {
    key: 'openai',
    name: 'OpenAI (GPT)',
    category: 'ai',
    scope: 'org',
    description: 'GPT modellari va OpenAI bilan mos har qanday xizmat.',
    docsUrl: 'https://platform.openai.com/docs/api-reference',
    fields: [apiKey('API kalit', 'platform.openai.com → API keys')],
    auth: { kind: 'bearer', field: 'apiKey' },
    test: { method: 'GET', url: 'https://api.openai.com/v1/models' },
    ai: { dialect: 'openai', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  },
  {
    key: 'gemini',
    name: 'Google Gemini',
    category: 'ai',
    scope: 'org',
    description: 'Google Gemini modellari.',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    fields: [apiKey('API kalit', 'aistudio.google.com → Get API key')],
    auth: { kind: 'header', header: 'x-goog-api-key', field: 'apiKey' },
    test: {
      method: 'GET',
      url: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1',
    },
    ai: {
      dialect: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-2.0-flash',
    },
  },
  {
    key: 'mistral',
    name: 'Mistral AI',
    category: 'ai',
    scope: 'org',
    description: 'Mistral modellari (Yevropa).',
    docsUrl: 'https://docs.mistral.ai/api/',
    fields: [apiKey('API kalit')],
    auth: { kind: 'bearer', field: 'apiKey' },
    test: { method: 'GET', url: 'https://api.mistral.ai/v1/models' },
    ai: {
      dialect: 'openai',
      baseUrl: 'https://api.mistral.ai/v1',
      defaultModel: 'mistral-small-latest',
    },
  },
  {
    key: 'openrouter',
    name: 'OpenRouter',
    category: 'ai',
    scope: 'org',
    description:
      'Yuzlab modellarga bitta kalit orqali kirish (Llama, DeepSeek, Qwen va boshqalar).',
    docsUrl: 'https://openrouter.ai/docs',
    fields: [apiKey('API kalit')],
    auth: { kind: 'bearer', field: 'apiKey' },
    test: { method: 'GET', url: 'https://openrouter.ai/api/v1/auth/key' },
    ai: {
      dialect: 'openai',
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'openai/gpt-4o-mini',
    },
  },
  {
    key: 'openai-compatible',
    name: 'OpenAI-mos (oʻz serveri)',
    category: 'ai',
    scope: 'org',
    description: 'vLLM, LM Studio, Ollama kabi oʻz serveringizdagi model (OpenAI formati).',
    docsUrl: 'https://platform.openai.com/docs/api-reference/chat',
    fields: [
      {
        key: 'baseUrl',
        label: 'Server manzili',
        secret: false,
        required: true,
        url: true,
        placeholder: 'https://llm.kompaniya.uz/v1',
      },
      { key: 'model', label: 'Model nomi', secret: false, required: true, placeholder: 'llama3.1' },
      { ...apiKey('API kalit'), required: false },
    ],
    auth: { kind: 'bearer', field: 'apiKey' },
    test: { method: 'GET', url: '{baseUrl}/models' },
    ai: { dialect: 'openai', baseUrl: '{baseUrl}', defaultModel: '{model}' },
  },
  {
    key: 'telegram-bot',
    name: 'Telegram bot',
    category: 'messenger',
    scope: 'org',
    description: 'Bildirishnomalarni Telegram bot orqali yuborish.',
    docsUrl: 'https://core.telegram.org/bots/api',
    fields: [
      {
        key: 'token',
        label: 'Bot tokeni',
        secret: true,
        required: true,
        help: '@BotFather → /newbot',
      },
    ],
    auth: { kind: 'urlToken', field: 'token' },
    test: { method: 'GET', url: 'https://api.telegram.org/bot{token}/getMe', expect: 'ok' },
  },
  {
    key: 'slack',
    name: 'Slack',
    category: 'messenger',
    scope: 'org',
    description: 'Slack kanallariga xabar va bildirishnoma.',
    docsUrl: 'https://api.slack.com/authentication/token-types',
    fields: [{ key: 'token', label: 'Bot tokeni (xoxb-…)', secret: true, required: true }],
    auth: { kind: 'bearer', field: 'token' },
    test: { method: 'POST', url: 'https://slack.com/api/auth.test', expect: 'ok' },
  },
  {
    key: 'github',
    name: 'GitHub',
    category: 'work',
    scope: 'user',
    description: 'Shaxsiy GitHub: topshiriqlar, pull request va muammolar.',
    docsUrl: 'https://docs.github.com/en/rest/authentication',
    fields: [{ key: 'token', label: 'Personal access token', secret: true, required: true }],
    auth: {
      kind: 'bearer',
      field: 'token',
      extra: { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' },
    },
    test: { method: 'GET', url: 'https://api.github.com/user' },
  },
  {
    key: 'notion',
    name: 'Notion',
    category: 'work',
    scope: 'user',
    description: 'Notion sahifalari va bazalari.',
    docsUrl: 'https://developers.notion.com/docs/authorization',
    fields: [
      {
        key: 'token',
        label: 'Integration tokeni (secret_… / ntn_…)',
        secret: true,
        required: true,
      },
    ],
    auth: { kind: 'bearer', field: 'token', extra: { 'notion-version': '2022-06-28' } },
    test: { method: 'GET', url: 'https://api.notion.com/v1/users/me' },
  },
  {
    key: 'edo',
    name: 'Hujjat aylanishi (EDO)',
    category: 'gov',
    scope: 'org',
    description: 'Tashkilotning hujjat aylanishi tizimi: hozir demo maʼlumot, ulangach haqiqiyi.',
    docsUrl: 'https://github.com/Dariko-HR-Marketing/My-Desktop/blob/main/docs/05-API.md',
    fields: [
      {
        key: 'baseUrl',
        label: 'API manzili',
        secret: false,
        required: true,
        url: true,
        placeholder: 'https://edo.kompaniya.uz/api',
      },
      apiKey('API kalit yoki token'),
    ],
    auth: { kind: 'bearer', field: 'apiKey' },
    test: { method: 'GET', url: '{baseUrl}/health' },
  },
  {
    key: 'rest',
    name: 'Ixtiyoriy REST API',
    category: 'custom',
    scope: 'org',
    description: 'Har qanday xizmat: manzil va kalit kiritiladi, modullar shu orqali ulanadi.',
    docsUrl:
      'https://github.com/Dariko-HR-Marketing/My-Desktop/blob/main/docs/11-INTEGRATSIYALAR.md',
    fields: [
      {
        key: 'baseUrl',
        label: 'Asosiy manzil',
        secret: false,
        required: true,
        url: true,
        placeholder: 'https://api.xizmat.uz/v1',
      },
      {
        key: 'header',
        label: 'Sarlavha nomi',
        secret: false,
        required: true,
        defaultValue: 'Authorization',
      },
      {
        key: 'apiKey',
        label: 'Kalit (toʻliq qiymat, masalan «Bearer …»)',
        secret: true,
        required: true,
      },
      {
        key: 'testPath',
        label: 'Tekshirish yoʻli',
        secret: false,
        required: false,
        defaultValue: '/',
        placeholder: '/health',
      },
    ],
    auth: { kind: 'header', header: '{header}', field: 'apiKey' },
    test: { method: 'GET', url: '{baseUrl}{testPath}' },
  },
  {
    key: 'webhook',
    name: 'Webhook (chiquvchi)',
    category: 'custom',
    scope: 'org',
    description:
      'Rahbar yuborgan bildirishnomalarni sizning manzilingizga JSON qilib yuboradi (xodimlarning shaxsiy vazifalari yuborilmaydi).',
    docsUrl:
      'https://github.com/Dariko-HR-Marketing/My-Desktop/blob/main/docs/11-INTEGRATSIYALAR.md',
    fields: [
      {
        key: 'url',
        label: 'Manzil',
        secret: false,
        required: true,
        url: true,
        placeholder: 'https://hooks.kompaniya.uz/ish-maydoni',
      },
      { key: 'secret', label: 'Imzo siri (HMAC-SHA256)', secret: true, required: false },
    ],
    auth: { kind: 'none' },
    test: null,
  },
];

export const providerByKey = (key: string) => INTEGRATION_PROVIDERS.find((p) => p.key === key);

/** What the API returns about one connection. Secret values never appear: only `hint` (last 4 characters). */
export interface IntegrationFieldState {
  key: string;
  set: boolean;
  /** Non-secret value, or "••••abcd" for a secret. */
  hint: string;
}

export interface IntegrationStatus {
  key: string;
  connected: boolean;
  fields: IntegrationFieldState[];
  updatedAt: string | null;
  lastTest: { ok: boolean; at: string; message: string } | null;
}

export interface IntegrationTestResult {
  ok: boolean;
  message: string;
  status: IntegrationStatus;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiCompleteRequest {
  /** Provider key; omitted = first connected AI provider. */
  provider?: string;
  model?: string;
  system?: string;
  messages: AiMessage[];
  maxTokens?: number;
}

export interface AiCompleteResponse {
  provider: string;
  model: string;
  text: string;
}
