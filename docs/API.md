# API

Backend API disiapkan di `backend/src/app.js`.

## Health

```http
GET /api/health
```

Response:

```json
{
  "status": "ok",
  "service": "inventaris-alkes-api"
}
```

## Inventory

```http
GET /api/inventory
```

Headers sementara:

```http
x-user-id: <user id>
x-user-role: Admin
x-user-name: admin
```

Flow:

```text
inventory.routes.js
-> inventory.controller.js
-> inventory.service.js
-> inventory.repository.js
-> Supabase
```

Endpoint lain dapat ditambahkan mengikuti pola module yang sama.
