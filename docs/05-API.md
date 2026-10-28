# 05 · Server API

Asosiy manzil: `https://<DOMAIN>` (masalan, `https://vps12546.eskiz.uz`). Format — JSON. Vaqtlar — ISO 8601 (UTC, `Z`).
Himoyalangan endpointlar: `Authorization: Bearer <JWT>`.

## Xato formati

```json
{ "error": "validation", "message": "Kiritilgan maʼlumot notoʻgʻri", "issues": [{ "path": "title", "message": "..." }] }
```
Kodlar: `400 validation` · `401 unauthorized / invalid_credentials` · `403 forbidden` · `404 not_found` · `429` (cheklov) · `501 not_implemented` · `503 unavailable` (tashqi manba) · `500 internal`.

## Turlar

```ts
type Role = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH';
type TaskSource = 'PLAN' | 'MANAGER' | 'PERSONAL' | 'MODULE';
type NotificationCategory = 'WORK' | 'MESSAGE' | 'SYSTEM';

interface User { id; login; fullName; position; department; role: Role }
interface Task { id; title; notes: string|null; source; status; priority; dueAt: string|null;
  assignedBy: string|null; externalRef: string|null; createdAt; updatedAt; completedAt: string|null }
interface NotificationItem { id; category; title; body; actionLabel: string|null; actionUrl: string|null;
  readAt: string|null; createdAt }
interface UserSettings { theme: 'light'|'dark'|'system'; density: 'comfortable'|'compact';
  language: 'uz-Latn'|'uz-Cyrl'|'ru'|'en'; pinnedApps: string[]; navCollapsed: boolean }
interface AppLink { key; name; url; category: 'MESSENGER'|'SOCIAL'|'VIDEO'|'WORK'|'GOV'|'SEARCH'; color; mandatory; order }
interface ModuleInfo { key; name; description; roles: Role[]; version }
interface ModuleSignal { moduleKey; label; count: number; tone: 'info'|'warning'|'danger'; url: string /* module://edo/documents */ }
```

## Endpointlar

### Tizim
| Metod | Yoʻl | Javob |
|---|---|---|
| GET | `/health` | `{ status: 'ok', store, uptimeSec, connections }` |

### Kirish
| Metod | Yoʻl | Tana | Javob |
|---|---|---|---|
| POST | `/api/auth/login` | `{ login, password }` | `{ token, user }` · 401 · cheklov 10/daqiqa |
| POST | `/api/auth/oneid` | — | 501 (2-bosqich) |
| POST | `/api/auth/eimzo` | — | 501 (2-bosqich) |
| GET | `/api/me` 🔒 | — | `{ user, settings }` |

### Bosh sahifa
| GET | `/api/dashboard` 🔒 | `{ tasks: { today, todayDone, open, overdue }, unreadNotifications, signals: ModuleSignal[], generatedAt }` |
|---|---|---|

### Vazifalar 🔒
| Metod | Yoʻl | Tana / soʻrov | Javob |
|---|---|---|---|
| GET | `/api/tasks` | `?status=TODO,IN_PROGRESS&dueBefore=<iso>` | `{ items: Task[] }` (muddat boʻyicha, muddatsizlar oxirida) |
| POST | `/api/tasks` | `{ title (1–500), notes?, source?, priority?, dueAt? }` | 201 `Task` |
| PATCH | `/api/tasks/:id` | kamida bitta: `title, notes, status, priority, dueAt` | `Task` (`status=DONE` → `completedAt` qoʻyiladi) |
| DELETE | `/api/tasks/:id` | — | 204 |

### Bildirishnomalar 🔒
| Metod | Yoʻl | Tana / soʻrov | Javob |
|---|---|---|---|
| GET | `/api/notifications` | `?unread=1&limit=50` | `{ items, unread }` |
| POST | `/api/notifications/read` | `{ ids: string[] \| 'all' }` | `{ count }` |
| POST | `/api/notifications` | `{ userId, category, title, body?, actionLabel?, actionUrl? }` | 201 — faqat MANAGER/ADMIN, aks holda 403 |

### Sozlamalar 🔒
| GET | `/api/settings` | `UserSettings` |
|---|---|---|
| PATCH | `/api/settings` | qisman `UserSettings` → yangilangan `UserSettings` (+ WS `settings.changed`) |

### Katalog va vidjetlar 🔒
| Metod | Yoʻl | Javob |
|---|---|---|
| GET | `/api/catalog/apps` | `{ items: AppLink[] }` (order boʻyicha) |
| GET | `/api/catalog/modules` | `{ items: ModuleInfo[] }` — faqat foydalanuvchi roliga ruxsat etilganlar |
| GET | `/api/widgets/currency` | `{ items: CurrencyRate[] (USD, EUR, RUB, KZT, CNY), fetchedAt, stale, source: 'Markaziy bank' }` · 503 |
| GET | `/api/widgets/weather` | `{ city, temperature, weatherCode, description, tomorrowMax, fetchedAt, stale }` · 503 |

Tashqi manbalar:
- Valyuta: `https://cbu.uz/uz/arkhiv-kursov-valyut/json/` (maydonlar: `Ccy`, `CcyNm_UZ`, `Rate`, `Diff`, `Date`) — kesh 30 daqiqa.
- Ob-havo: `https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current=temperature_2m,weather_code&daily=temperature_2m_max&forecast_days=2&timezone=auto` — kesh 15 daqiqa. WMO kodlari oʻzbekcha tavsifga oʻgiriladi.
- Tashqi manba ishlamasa — oxirgi kesh `stale: true`; kesh ham yoʻq boʻlsa — 503.

## WebSocket

`wss://<DOMAIN>/ws?token=<JWT>` (token notoʻgʻri → yopish kodi `4401`, klient qayta urinmaydi).

Server → klient xabarlari:
```json
{ "type": "hello", "payload": { "userId": "..." } }
{ "type": "notification.created", "payload": NotificationItem }
{ "type": "notifications.read", "payload": { "count": 3 } }
{ "type": "task.changed", "payload": Task }
{ "type": "task.deleted", "payload": { "id": "..." } }
{ "type": "settings.changed", "payload": UserSettings }
```
Server har 25 s da ping yuboradi.

## Xavfsizlik

- CORS: faqat `CORS_ORIGINS` roʻyxati (`tauri://localhost`, `http://tauri.localhost`, dev uchun `http://localhost:1420`).
- Umumiy cheklov: 300 soʻrov/daqiqa (IP); login — 10/daqiqa.
- Parollar bcrypt (12 raund); login xatosida javob vaqti bir xil (soxta xesh bilan solishtirish).
- Tana hajmi ≤ 1 MB; WS xabari ≤ 64 KB.
