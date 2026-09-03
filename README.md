# Inventaris Alkes Automation System

AI Automation System untuk inventaris, maintenance, kalibrasi, approval, notifikasi, Telegram bot, dan dashboard monitoring alat kesehatan rumah sakit.

## Struktur Utama

- `frontend/public`: file statis yang dideploy ke Firebase Hosting.
- `frontend/src`: area refactor modular frontend.
- `backend/src`: API, automation, bot Telegram, Gmail worker, repositories, services, dan integrations.
- `database`: schema, migration, seed, fixes, dan backup SQL.
- `docs`: dokumentasi arsitektur, instalasi, deployment, API, dan environment.
- `scripts`: helper setup, deploy, migration, dan maintenance.

## Perintah Penting

```powershell
npm install
npm run serve
npm run deploy
npm run bot:inventory
npm run bot:ai
npm run mail:vendor
```

## Keamanan

Jangan commit `.env`, token Telegram, service role Supabase, Gmail app password, atau backup ZIP privat.
Frontend hanya boleh memakai Supabase anon/publishable key. Service role key hanya untuk backend.

Detail lanjutan ada di folder `docs/`.
