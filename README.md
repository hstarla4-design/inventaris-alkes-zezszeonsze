# Inventaris Alkes Automation System

**Inventaris Alkes Automation System** adalah platform open-source untuk digitalisasi manajemen alat kesehatan yang dirancang bagi rumah sakit, klinik, puskesmas, dan fasilitas pelayanan kesehatan yang masih mengandalkan pencatatan manual menggunakan buku besar atau spreadsheet sederhana.

Project ini dikembangkan untuk menyediakan solusi yang mudah diimplementasikan, berbiaya rendah, dan dapat dikembangkan secara berkelanjutan oleh komunitas. Fokus utamanya adalah membantu fasilitas kesehatan meningkatkan pengelolaan inventaris, preventive maintenance, corrective maintenance, kalibrasi, workflow approval, notifikasi, serta monitoring alat kesehatan melalui satu sistem yang terintegrasi.

## Open Source Mission

Project ini dibangun dengan prinsip **open source**, sehingga kode sumber dapat digunakan, dipelajari, dimodifikasi, dan dikembangkan oleh siapa pun sesuai kebutuhan implementasi masing-masing institusi.

Kontribusi dari komunitas sangat diharapkan, baik dalam bentuk perbaikan bug, pengembangan fitur baru, peningkatan dokumentasi, optimasi performa, maupun integrasi dengan teknologi lain. Tujuan jangka panjang project ini adalah menyediakan platform manajemen alat kesehatan yang dapat diakses oleh fasilitas kesehatan dengan keterbatasan anggaran tanpa mengurangi kualitas pengelolaan aset dan operasional elektromedik.

## Struktur Project

- `frontend/public` — aplikasi frontend untuk deployment ke Firebase Hosting.
- `frontend/src` — source code frontend dan komponen dashboard.
- `backend/src` — API, automation, Telegram Bot, Gmail worker, service, repository, dan integration.
- `database` — schema, migration, seed, database fix, dan backup SQL.
- `docs` — dokumentasi arsitektur, instalasi, deployment, API, dan konfigurasi environment.
- `scripts` — helper untuk setup, deployment, migration, dan maintenance.
- `supabase` — konfigurasi integrasi Supabase.
- `tests` — pengujian sistem dan validasi fitur.

## Fitur Utama

Sistem dirancang untuk mendukung operasional elektromedik secara terintegrasi melalui fitur berikut.

- Manajemen inventaris alat kesehatan
- QR Code untuk identifikasi alat
- Monitoring kondisi dan status alat
- Manajemen ruangan
- Preventive Maintenance
- Corrective Maintenance
- Emergency Breakdown
- Manajemen kalibrasi
- Monitoring masa berlaku sertifikat
- Mutasi alat antar ruangan
- Workflow pengajuan dan approval
- Manajemen vendor maintenance dan kalibrasi
- Feedback dan verifikasi pekerjaan vendor
- Notification System
- Telegram Bot operasional
- AI Assistant untuk analisis data
- Gmail Automation untuk komunikasi vendor
- Dashboard monitoring berdasarkan role
- Laporan dan ekspor PDF

## Role Pengguna

Sistem menerapkan **Role-Based Access Control (RBAC)** untuk memastikan setiap pengguna memiliki akses sesuai tanggung jawabnya.

### Admin

Mengelola seluruh data sistem, pengguna, konfigurasi, dan aktivitas operasional.

### Teknisi

Melakukan maintenance, kalibrasi, pengajuan pekerjaan, verifikasi hasil pekerjaan, serta operasional alat kesehatan.

### Kepala Ruangan

Memantau kondisi alat pada ruangan masing-masing dan melaporkan kebutuhan perbaikan.

### Supervisor

Melakukan monitoring, approval pekerjaan, pengelolaan vendor, analisis risiko, serta melihat laporan eksekutif.

### Vendor Maintenance

Menerima dan menyelesaikan pekerjaan maintenance yang diberikan oleh rumah sakit.

### Vendor Kalibrasi

Menerima dan menyelesaikan pekerjaan kalibrasi sesuai penugasan.

## Automation

Platform mengintegrasikan beberapa sistem otomatis untuk meningkatkan efisiensi operasional.

- **Telegram Bot** untuk akses informasi inventaris dan operasional alat.
- **AI Assistant** untuk analisis inventaris, maintenance, kalibrasi, biaya, vendor, serta prioritas pekerjaan.
- **Gmail Automation** untuk pengiriman email dan komunikasi kepada vendor.
- **Notification System** untuk pemberitahuan pengajuan, approval, maintenance, kalibrasi, dan pekerjaan vendor.

## Teknologi

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js dan Express
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Firebase Hosting
- **Automation:** OpenClaw
- **AI:** DeepSeek / AI Provider
- **Messaging:** Telegram Bot
- **Email:** Gmail SMTP

## Instalasi

Clone repository kemudian install seluruh dependency.

```bash
npm install
```

Jalankan aplikasi secara lokal.

```bash
npm run serve
```

## Perintah Penting

```bash
npm run serve
npm run deploy
npm run bot:inventory
npm run bot:ai
npm run mail:vendor
```

## Keamanan

Jangan pernah melakukan commit informasi sensitif ke repository.

- `.env`
- Telegram Bot Token
- Supabase Service Role Key
- Gmail App Password
- AI API Key
- Database credentials
- Private database backup

Frontend hanya menggunakan **Supabase Anon/Publishable Key**, sedangkan **Service Role Key** hanya digunakan pada backend.

## Status Project

**Active Development**

Proyek ini sedang dalam pengembangan aktif. Fitur inti seperti manajemen inventaris, maintenance, kalibrasi, RBAC, dan automation terus dikembangkan, sementara fitur lanjutan seperti predictive maintenance, analytics, dan integrasi AI akan ditambahkan secara bertahap sesuai roadmap proyek.
## Contact

Email: hstarla4@gmail.com
