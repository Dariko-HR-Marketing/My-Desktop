# 11 · Integratsiyalar (API kalitlar, sunʼiy intellekt, tashqi xizmatlar)

Bu hujjat ilovani tashqi xizmatlarga — sunʼiy intellekt modellari, messenjerlar, ish vositalari, tashkilot tizimlari — ulashning **yagona usulini** tasvirlaydi. Kalitlar bir joyda saqlanadi (Sozlamalar → Integratsiyalar), serverda shifrlanadi va hech qachon ilovaga qaytarilmaydi.

## Qanday ishlaydi

```
Sozlamalar → Integratsiyalar ──PUT /api/integrations/:key──▶ server ──AES-256-GCM──▶ PostgreSQL (Integration)
                                                              │
        modullar / AI shlyuzi / webhook ◀── credentials() ────┘   (kalit faqat server xotirasida ochiladi)
```

- **Katalog** — `packages/shared/src/integrations.ts` (`INTEGRATION_PROVIDERS`). Server (tekshirish, imzo) va desktop (forma) shu bitta roʻyxatdan foydalanadi.
- **Doira (`scope`)**: `org` — butun tashkilot uchun bitta ulanish, faqat **administrator** boshqaradi; `user` — har xodim oʻz hisobini ulaydi (masalan, GitHub).
- **Holatlar**: Ulanmagan → Saqlangan → Ishlayapti / Xato (oxirgi tekshiruv natijasi bilan).

## Xavfsizlik modeli

| Xavf | Himoya |
|---|---|
| Kalit bazadan oʻgʻirlansa | `dataEnc` — AES-256-GCM (har yozuvga yangi nonce, autentifikatsiyalangan). Kalit `INTEGRATIONS_KEY` faqat server `.env` da |
| Kalit ilovaga/jurnalga sizib chiqsa | API kalitni **qaytarmaydi** (faqat `••••abcd`); xato matnlari va jurnalda kalit yoʻq; testlar buni tekshiradi |
| Xodim tashkilot kalitini oʻzgartirsa | `org` doiradagi yozish/oʻchirish/tekshirish faqat `ADMIN` (403) |
| Manzil orqali ichki tarmoqqa kirish (SSRF) | Foydalanuvchi kiritgan har bir manzil: faqat `https`, IP/localhost/ichki domen yoʻq, DNS javobi ochiq manzil boʻlishi shart; **redirect ergashilmaydi** (sarlavhadagi kalit boshqa hostga ketmasin) |
| Suiisteʼmol (AI limiti) | `/api/ai/complete` va `/test` — daqiqada 20 soʻrov; matn hajmi, token va xabar soni cheklangan |
| `INTEGRATIONS_KEY` yoʻq | Server ishga tushadi, lekin yozish `503 integrations_disabled` qaytaradi (hech narsa ochiq saqlanmaydi) |

**`INTEGRATIONS_KEY`**: `openssl rand -base64 32`. `deploy/setup-server.sh` yangi serverda yaratadi, `deploy/update-server.sh` mavjud serverda (yoʻq boʻlsa) **bir marta** qoʻshadi. `deploy/.env` ni zaxiralang: kalit yoʻqolsa, saqlangan integratsiya kalitlarini qayta kiritish kerak boʻladi (kalitni almashtirish vositasi hozircha yoʻq).

## Katalog va kalitni qayerdan olish

| Xizmat | Kalit | Qayerdan | Tekshiruv |
|---|---|---|---|
| Anthropic (Claude) | `apiKey` | console.anthropic.com → API Keys | `GET /v1/models` |
| OpenAI (GPT) | `apiKey` | platform.openai.com → API keys | `GET /v1/models` |
| Google Gemini | `apiKey` | aistudio.google.com → Get API key | `GET /v1beta/models` |
| Mistral AI | `apiKey` | console.mistral.ai → API keys | `GET /v1/models` |
| OpenRouter | `apiKey` | openrouter.ai → Keys (yuzlab model) | `GET /api/v1/auth/key` |
| OpenAI-mos (oʻz serveri) | `baseUrl`, `model`, `apiKey` (ixtiyoriy) | vLLM / LM Studio / Ollama (`/v1`). **Ochiq https domen** kerak | `GET {baseUrl}/models` |
| Telegram bot | `token` | @BotFather → `/newbot` | `getMe` |
| Slack | `token` (`xoxb-…`) | api.slack.com/apps → OAuth & Permissions | `auth.test` |
| GitHub (shaxsiy) | `token` | Settings → Developer settings → PAT | `GET /user` |
| Notion (shaxsiy) | `token` | notion.so/profile/integrations | `GET /v1/users/me` |
| Hujjat aylanishi (EDO) | `baseUrl`, `apiKey` | tashkilot IT boʻlimi | `GET {baseUrl}/health` |
| Ixtiyoriy REST | `baseUrl`, `header`, `apiKey`, `testPath` | har qanday xizmat | `GET {baseUrl}{testPath}` |
| Webhook (chiquvchi) | `url`, `secret` (ixtiyoriy) | sizning serveringiz | — |

Ichki (xususiy) tarmoqdagi model uchun: serverni ochiq https domenga chiqaring (reverse proxy + token). Ichki IP/domenlar xavfsizlik uchun ataylab bloklangan.

## Sunʼiy intellekt shlyuzi

Bitta shakl — istalgan ulangan model (`provider` koʻrsatilmasa, birinchi ulangani):

```http
POST /api/ai/complete
Authorization: Bearer <token>

{ "provider": "anthropic", "system": "Qisqa javob ber",
  "messages": [{ "role": "user", "content": "Bugungi vazifalarni jamla" }], "maxTokens": 500 }
→ 200 { "provider": "anthropic", "model": "claude-sonnet-5-5", "text": "…" }
```

- `GET /api/ai/providers` — hozir ulangan modellar (xodimlar ham koʻradi).
- Xatolar: `404 ai_not_connected` (hech biri ulanmagan), `502 ai_rejected` (kalit rad etildi), `503 ai_busy` (limit/band), `502 ai_error|ai_unreachable`.
- Uch “lahja”: `anthropic` (`/v1/messages`), `openai` (`/chat/completions`: OpenAI, Mistral, OpenRouter, oʻz server), `gemini` (`generateContent`) — `services/ai.ts`.

## Server modullari uchun: kalitni ishlatish

```ts
// modul adapterida (apps/server/src/modules/…): kalit faqat serverda ochiladi
const creds = await deps.integrations.credentials('edo', ctx.userId); // null = ulanmagan
if (!creds) return demoData;
const req = signRequest(providerByKey('edo')!, creds, { method: 'GET', url: '{baseUrl}/documents' });
const res = await deps.http(req); // SSRF-himoyalangan klient
```

`signRequest` kalitni provayderning `auth` qoidasiga koʻra qoʻyadi (Bearer / maxsus sarlavha / URL token).

## Webhook (chiquvchi)

Hozir bitta hodisa: `notification.created` (rahbar yuborgan bildirishnoma). Xodimlarning shaxsiy vazifalari **yuborilmaydi**.

```http
POST <url>
content-type: application/json
x-ish-event: notification.created
x-ish-signature: sha256=<HMAC-SHA256(secret, body) hex>      (secret kiritilgan boʻlsa)

{ "event": "notification.created", "at": "2026-10-29T10:00:00.000Z", "data": { "userId": "…", "notification": { … } } }
```

Qabul qiluvchi imzoni `secret` bilan qayta hisoblab solishtirsin. Yetkazish xatosi asosiy soʻrovni sekinlashtirmaydi va buzmaydi (5 s limit, jim).

## Yangi xizmat qoʻshish (3 qadam)

1. `packages/shared/src/integrations.ts` dagi `INTEGRATION_PROVIDERS` ga yozuv qoʻshing: `key`, `category`, `scope`, `fields`, `auth`, `test` (AI boʻlsa `ai.dialect`).
2. Kerak boʻlsa i18n (`integ.cat.*`) — forma va roʻyxat avtomatik chiqadi, desktop kodini oʻzgartirish shart emas.
3. Server tomonida `credentials(key, userId)` + `signRequest` bilan ishlating; test yozing (`apps/server/test/integrations.test.ts` dan namuna).

Yangi “lahja”li AI (masalan, Cohere) boʻlsa — `services/ai.ts` ga bitta tarmoq qoʻshiladi.

## Hozircha qamrab olinmagan

- OAuth2 (brauzerda “Google bilan ulash”): kalit/token qoʻlda kiritiladi; OAuth oqimi keyingi bosqich.
- Kalitni almashtirish (`INTEGRATIONS_KEY` rotatsiyasi) va audit jurnali sahifasi.
- Ichki tarmoqdagi servislarga ulanish (SSRF himoyasi tufayli ataylab yopiq).
