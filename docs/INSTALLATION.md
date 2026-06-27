# Installation

## Requirement

- Node.js 22+
- Firebase CLI
- Supabase CLI
- Akun Supabase
- Firebase project
- Telegram Bot Token
- Gmail App Password untuk pengiriman surat vendor

## Setup

```powershell
cd "C:\Users\hstar\OneDrive\Documents\New project"
npm install
```

Salin environment:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Isi nilai rahasia di `backend\.env`. Jangan commit file `.env`.

## Local Hosting

```powershell
npm run serve
```

## Bot

```powershell
npm run bot:inventory
npm run bot:ai
```

## Gmail Worker

```powershell
npm run mail:vendor
```
