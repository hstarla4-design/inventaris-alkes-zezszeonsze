# Architecture

Project memakai clean architecture bertahap.

```text
Routes -> Controllers -> Services -> Repositories -> Supabase
```

## Frontend

Firebase Hosting menyajikan `frontend/public`. File aktif saat ini:

- `frontend/public/index.html`
- `frontend/public/assets/js/app.js`
- `frontend/public/assets/css/styles.css`
- `frontend/public/assets/js/config.runtime.js`

Folder `frontend/src` disiapkan untuk pemecahan bertahap menjadi pages, components, services, state, config, dan utils.

## Backend

Backend berada di `backend/src`.

- `routes`: API entrypoint.
- `controllers`: request/response orchestration.
- `services`: business logic.
- `repositories`: data access Supabase.
- `middlewares`: auth, role, validation, error, rate limit.
- `integrations`: Supabase, Telegram, Gmail, Firebase.
- `automation`: automation engine dan rules.
- `jobs`: job yang bisa dipanggil manual atau scheduler.
- `schedulers`: cron scheduler.
- `modules`: domain modules.

## Automation

Automation system dipisah menjadi:

- rules: definisi logic dan trigger.
- jobs: pekerjaan executable seperti email queue.
- schedulers: penjadwalan periodik.
- integrations: Telegram/Gmail/Supabase clients.

## Compatibility

Root masih memiliki wrapper:

- `telegram-inventory-bot.mjs`
- `telegram-ai-router-bot.mjs`
- `gmail-vendor-mailer.mjs`
- `openclaw-inventory.mjs`

Wrapper ini menjaga command lama tetap bekerja.
