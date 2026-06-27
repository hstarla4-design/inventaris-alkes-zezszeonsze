# Security

## Implemented

- `.gitignore` untuk `.env`, logs, build output, node_modules, dan backup ZIP.
- Environment config terpusat di `backend/src/config`.
- Supabase public/admin client dipisah.
- Middleware auth dan role disiapkan.
- Middleware validation disiapkan dengan Zod.
- Rate limiting disiapkan.
- Error handler terpusat.
- Gmail credential hanya dipakai backend worker.

## Important Rules

- Jangan simpan service role key di frontend.
- Jangan commit Gmail password atau Telegram token.
- Gunakan Gmail App Password, bukan password utama akun.
- Batasi route approval/vendor dengan role middleware.
- Validasi upload sebelum diterima backend.
