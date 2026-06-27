# Automation Workflow

## Approval ke Vendor

1. Teknisi/Kepala Ruangan membuat pengajuan.
2. Kepala Ruangan approve.
3. Supervisor approve.
4. Jika butuh vendor, sistem membuat record `maintenance` atau `kalibrasi`.
5. Sistem membuat `surat_vendor`.
6. Sistem memasukkan email ke `email_queue`.
7. Gmail worker mengirim surat ke email vendor.

## Telegram Automation

Bot operasional:

```text
backend/src/integrations/telegram/telegram-inventory-bot.mjs
```

Bot AI router:

```text
backend/src/integrations/telegram/telegram-ai-router-bot.mjs
```

## Gmail Automation

Worker:

```text
backend/src/jobs/vendor-email.job.js
backend/src/integrations/gmail/gmail-vendor-mailer.mjs
```

## Scheduler

Scheduler disiapkan di:

```text
backend/src/schedulers/index.js
```
