# Ish maydoni

Xodimning yagona desktop ish stoli: vazifalar, bildirishnomalar, ichki brauzer va ulanadigan modullar bitta oynada.

## Tuzilma

- `apps/desktop` — Tauri 2 + React 19 + TypeScript (Vite)
- `apps/server` — Fastify 5 + TypeScript (keyinroq Prisma/PostgreSQL)
- `packages/shared` — desktop va server uchun umumiy turlar
- `docs/` — texnik topshiriq, arxitektura, dizayn tizimi, maketlar
- `CLAUDE.md` — loyiha qoidalari

## Ishga tushirish

Talab: Node.js 22 (`.nvmrc`), Rust (faqat Tauri uchun).

```bash
npm install
npm run dev:server     # API: http://localhost:8080
npm run dev:desktop    # UI brauzerda: http://localhost:1420
npm run tauri:dev      # desktop ilova
```

## Tekshiruv

```bash
npm run typecheck && npm test && npm run build
cd apps/desktop/src-tauri && cargo check
```

Linux'da `cargo check` uchun: `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`.

## Serverga joylashtirish (deploy)

Domen: `my-desk.tajriba24.uz` (A yozuv → `95.130.227.92`). Batafsil: `docs/07-SERVER-VA-DEPLOY.md`.

1. Oʻz kompyuteringizda kalit yarating: `ssh-keygen -t ed25519 -C "github-deploy" -f deploy_key` (parolsiz).
2. Serverga `deploy/setup-server.sh` ni nusxalab, root sifatida bir marta ishga tushiring:
   `DEPLOY_PUBKEY="$(cat deploy_key.pub)" DOMAIN=my-desk.tajriba24.uz bash setup-server.sh`.
   Skript oxirida admin paroli (`admin / …`) bir marta chiqadi — saqlab qoʻying.
3. GitHub → Settings → Secrets and variables → Actions: `SSH_HOST` (`95.130.227.92`), `SSH_USER` (`deploy`), `SSH_PRIVATE_KEY` (`deploy_key` mazmuni), `DOMAIN` (`my-desk.tajriba24.uz`).
4. Actions → «Deploy server» → Run workflow. Tekshiruv: `https://my-desk.tajriba24.uz/health` → `ok`.
5. `ssh deploy@95.130.227.92` kalit bilan ishlashiga ishonch hosil qilgach, `HARDEN_SSH=yes` bilan skriptni qayta ishga tushirib parol bilan kirishni oʻchiring.

Parol va kalitlarni repozitoriyga yozmang. `deploy/.env` faqat serverda turadi.
