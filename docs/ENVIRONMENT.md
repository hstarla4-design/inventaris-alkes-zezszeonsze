# Environment Variables

## Backend

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
GMAIL_USER=
GMAIL_APP_PASSWORD=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

Service role Supabase hanya boleh berada di backend.

## Frontend

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=
```

Frontend tidak boleh berisi service role key, Gmail password, atau token Telegram.

Untuk static hosting saat ini, runtime config berada di:

```text
frontend/public/assets/js/config.runtime.js
```
