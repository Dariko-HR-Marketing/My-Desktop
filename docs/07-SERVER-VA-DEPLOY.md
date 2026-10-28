# 07 · Server va joylashtirish (deploy)

> **Amaldagi holat (2026-10-28):** server qoʻlda joylashtirilgan. Serverda boshqa saytlar ham ishlaydi, shuning uchun 80/443 portni umumiy Caddy ushlaydi va `my-desk.tajriba24.uz` ni `api` konteyneriga yoʻnaltiradi; ushbu hujjatdagi `docker-compose.yml` dagi alohida `caddy` xizmati faqat boʻsh serverda ishlatiladi. Yangilash tartibi — `README.md` dagi «Serverga joylashtirish» boʻlimi.

## 1. Server

| Parametr | Qiymat |
|---|---|
| Provayder | Eskiz (vmmanager), KVM |
| OS | Ubuntu 24.04 |
| Resurs | 2 vCPU · 2 GB RAM · 40 GB disk |
| IP | 95.130.227.92 |
| Domen | my-desk.tajriba24.uz |

> Eslatma: skrinshotda RAM ~41 % va disk ~50 % allaqachon band. Serverda boshqa xizmat ishlayotgan boʻlishi mumkin — oʻrnatishdan oldin `docker ps`, `ss -tlnp` (80/443 portlar bandmi) va `df -h` bilan tekshiring.

## 2. Tarkib (Docker Compose)

| Xizmat | Obraz | Xotira chegarasi | Vazifasi |
|---|---|---|---|
| postgres | postgres:16-alpine | 384 MB | `shared_buffers=96MB`, `max_connections=40` |
| api | apps/server/Dockerfile (node:22-slim) | 384 MB | `NODE_OPTIONS=--max-old-space-size=256` |
| caddy | caddy:2-alpine | 96 MB | 80/443, avtomatik HTTPS (Let's Encrypt), siqish, xavfsizlik sarlavhalari |

API konteyneri ishga tushganda: `prisma migrate deploy` (yoki MVP da `db push`) → `seed` → `node dist/index.js`. Sogʻliq tekshiruvi: `GET /health`.

`deploy/Caddyfile`:
```
{$DOMAIN} {
  encode zstd gzip
  header { Strict-Transport-Security "max-age=31536000; includeSubDomains"; X-Content-Type-Options "nosniff"; X-Frame-Options "DENY"; Referrer-Policy "no-referrer"; -Server }
  reverse_proxy api:8080
}
```

## 3. Serverni bir martalik tayyorlash (`deploy/setup-server.sh`)

1. Paketlar: `ca-certificates curl gnupg ufw rsync fail2ban`.
2. Docker Engine + Compose plagini (rasmiy Docker reposidan).
3. **Swap 2 GB** (2 GB RAM bilan Docker build uchun zarur).
4. `deploy` foydalanuvchisi, `docker` guruhiga qoʻshiladi; `/opt/my-desktop`.
5. Xavfsizlik devori: faqat 22, 80, 443.
6. SSH: parol bilan kirishni oʻchirish, faqat kalit (`PasswordAuthentication no`).

## 4. Muhit oʻzgaruvchilari (`/opt/my-desktop/deploy/.env` — repozitoriyga tushmaydi)

```
DOMAIN=my-desk.tajriba24.uz
POSTGRES_PASSWORD=<openssl rand -base64 48>
JWT_SECRET=<openssl rand -base64 48>
SEED_ADMIN_PASSWORD=<kamida 10 belgi, birinchi kirishdan keyin almashtiring>
JWT_EXPIRES_IN=12h
CORS_ORIGINS=tauri://localhost,http://tauri.localhost
```

## 5. GitHub Actions

### 5.1. `ci.yml` — har bir push/PR da
- Node 22: `npm install` → `npm run typecheck` → `npm test` → `npm run build`.
- Rust (ubuntu): `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf` → `cargo check` (`apps/desktop/src-tauri`).
- Birinchi muvaffaqiyatli `npm install` dan keyin `package-lock.json` repozitoriyga qoʻshiladi va CI `npm ci` ga oʻtadi.

### 5.2. `deploy-server.yml` — `main` ga push (faqat `apps/server/**`, `deploy/**` oʻzgarsa) yoki qoʻlda
1. SSH kalitni oʻrnatish (`secrets.SSH_PRIVATE_KEY`), `known_hosts` (`ssh-keyscan`).
2. `rsync -az --delete apps/server/ deploy/ → deploy@HOST:/opt/my-desktop/` (`.env` saqlanadi — `--exclude .env`).
3. `ssh deploy@HOST "cd /opt/my-desktop/deploy && docker compose --env-file .env up -d --build && docker image prune -f"`.
4. Tekshiruv: `curl -fsS https://$DOMAIN/health`.

**GitHub Secrets** (Settings → Secrets and variables → Actions):

| Nom | Qiymat |
|---|---|
| `SSH_HOST` | `95.130.227.92` |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | GitHub Actions uchun alohida yaratilgan ED25519 kalitning **yopiq** qismi |
| `DOMAIN` | `my-desk.tajriba24.uz` |

Kalit yaratish (oʻz kompyuteringizda): `ssh-keygen -t ed25519 -C "github-deploy" -f deploy_key` → `deploy_key.pub` serverdagi `/home/deploy/.ssh/authorized_keys` ga, `deploy_key` — `SSH_PRIVATE_KEY` secret'iga. **Parol va kalitlarni chatga yoki kodga yozmang.**

### 5.3. `release-desktop.yml` — `v*` teg qoʻyilganda
- `tauri-apps/tauri-action` — Windows (`.msi`, `.exe`), macOS (`.dmg`), Linux (`.deb`, `.AppImage`).
- Imzolash: Windows kod imzosi sertifikati (keyingi bosqich), Tauri updater kaliti (`TAURI_SIGNING_PRIVATE_KEY`).
- GitHub Release ga yuklanadi; ilova `updater` orqali yangilanishni oʻzi topadi.

## 6. Zaxira nusxa va monitoring

- Har kuni `pg_dump` → `/opt/my-desktop/backups` (7 kunlik), haftada bir — tashqi joyga.
- `docker compose logs --tail=200 api` — xatolar; keyinroq Uptime monitoring (`/health`).
- Disk 80 % dan oshsa — ogohlantirish.

## 7. Desktop ilovani tarqatish

- Kichik tashkilot: Release'dan `.msi` ni yuklab, har kompyuterga oʻrnatish.
- Katta tashkilot: guruh siyosati (GPO) yoki Intune orqali jim oʻrnatish: `msiexec /i IshMaydoni.msi /qn`.
- Birinchi ishga tushishda server manzili (`https://my-desk.tajriba24.uz`) — oʻrnatmaga oldindan yozilgan yoki Sozlamalarda.
