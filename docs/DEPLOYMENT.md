# Deployment

## Firebase Hosting

Firebase Hosting sekarang membaca dari:

```text
frontend/public
```

Deploy:

```powershell
npm run deploy
```

## Supabase

SQL sudah dipisah:

- `database/schema`
- `database/migrations`
- `database/fixes`
- `database/seed`
- `database/backup`

Jalankan migration yang diperlukan melalui Supabase SQL Editor atau Supabase CLI.

## Background Workers

Untuk production, jalankan proses berikut di server/VPS/Task Scheduler:

```powershell
npm run bot:inventory
npm run bot:ai
npm run mail:vendor
```

Gmail worker membaca `email_queue` dan mengirim surat vendor melalui Gmail App Password.
