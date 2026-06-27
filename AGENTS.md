# Hermes Agent - Development Guide for Inventaris Alat Kesehatan Project

This guide serves as a working instruction for Hermes/Codex agents when assisting with the medical equipment inventory project. The agent should understand:

*   This system is a medical equipment inventory application.
*   Users have different roles.
*   Access levels for each role must be distinct.
*   Operational bots and AI bots have different functions.
*   Website changes must remain safe for mobile and Supabase data.

## Preferred Stack

Backend: Flask
Database: MySQL/Supabase
Frontend: Bootstrap/Tailwind
Automation: OpenClaw
AI Assistant: Hermes Agent
Messaging: Telegram Bot

## AI Safety Rules

*   Never expose .env content.
*   Never print API keys.
*   Never delete database tables automatically.
*   Always ask confirmation before destructive actions.
*   Do not modify authentication logic without approval.
*   Limit file access to project directory only.

## Role Admin

Admin is the highest role.

### Access:

*   View all equipment data from all rooms.
*   View all users/officers.
*   View pending user registrations.
*   View all maintenance, calibration, mutation, notifications, and requests.
*   View all rooms.
*   View the full summary dashboard.

### Functions:

*   Approve or reject user registration.
*   Add/edit/delete equipment.
*   Download QR for all equipment.
*   View complete equipment history.
*   View all reports from room heads.
*   Monitor technician and vendor work.
*   Manage master data like rooms and officers.

### Limitations:

*   Admin can view everything, but data deletion must be handled carefully.
*   Do not delete equipment/maintenance/calibration without explicit confirmation.
*   Do not display tokens, API keys, database passwords, or Supabase credentials.

### AI:

*   Admin uses ChatGPT/OpenAI if quota is active.
*   If OpenAI quota is exhausted, fallback to Gemini.
*   Admin can ask for data analysis, summaries, priorities for broken equipment, maintenance/calibration status.

## Role Teknisi

Teknisi (Technician) is the main operational officer for equipment.

### Access:

*   View all equipment.
*   View all rooms.
*   View equipment list per room.
*   View work notifications directed to technicians.
*   View and fill in maintenance data.
*   View and fill in calibration data.
*   View requests related to technicians.
*   Download equipment QR.

### Functions:

*   Add new equipment.
*   Edit equipment data.
*   Input preventive/corrective/inspection maintenance.
*   Input calibration.
*   Update work status from room head notifications.
*   Upload before/after work photos.
*   Upload spare part/invoice photos if needed.
*   View equipment history.
*   View next maintenance and next calibration schedule.

### Limitations:

*   Technicians do not manage user registration approval.
*   Technicians cannot change user roles.
*   Technicians cannot delete important data without confirmation.
*   Technicians can view all equipment, but certain actions follow workflow.

### Operational Bot:

*   `/menu`
*   `/daftar_alat` (list equipment)
*   `/daftar_ruangan` (list rooms)
*   `ICU, NICU, ruangan ICU` (example room query)
*   `/download_qr`
*   `/maintenance`
*   `/tambah_maintenance` (add maintenance)
*   `/kalibrasi` (calibration)
*   `/tambah_kalibrasi` (add calibration)
*   `/notifikasi` (notifications)
*   `/pengajuan` (requests)
*   `/status_pengajuan` (request status)

## Role Kepala Ruangan

Kepala Ruangan (Room Head) is the user responsible for equipment in a specific room.

### Access:

*   Only view equipment in the room connected via `ruangan_id`.
*   View equipment history in their room.
*   View status of reports created from their room.
*   View maintenance/calibration of equipment in their room.
*   Download QR for equipment in their room.

### Functions:

*   Report damaged/lost/error equipment to technicians.
*   Create Room Head reports.
*   Send notifications to technicians.
*   Check report status.
*   Check report history.
*   Approve completed reports if workflow requires room head approval.
*   Submit maintenance/calibration requests for equipment in their room.

### Limitations:

*   Cannot view all rooms like admin/technicians.
*   Cannot edit global equipment data.
*   Cannot delete equipment.
*   Cannot view user registration data.
*   If the account does not have a `ruangan_id`, display a message that the account is not connected to a room.

### Operational Bot:

*   `/daftar_alat` (list equipment)
*   `/cari_alat` (search equipment)
*   `/download_qr`
*   `/laporan_kr` (room head report)
*   `/status_laporan` (report status)
*   `/histori_laporan` (report history)
*   `/maintenance`
*   `/kalibrasi`
*   `/approve_pengajuan` (approve request)

## Role Supervisor

Supervisor is a monitoring and advanced approval role.

### Access:

*   View dashboard summary.
*   View requests requiring supervisor approval.
*   View equipment history.
*   View maintenance and calibration data for monitoring.
*   View status of work forwarded to the supervisor.

### Functions:

*   Approve requests.
*   Reject requests.
*   Monitor technician/vendor work.
*   View priorities for damaged equipment/maintenance.
*   Make decisions for specific requests.

### Limitations:

*   Supervisor is not the primary input operator.
*   Does not add/edit/delete equipment unless system rules later allow it.
*   Does not approve user registration unless decided equivalent to admin.
*   Does not manage vendor work.

### Operational Bot:

*   `/ringkasan` (summary)
*   `/status_pengajuan` (request status)
*   `/approve_pengajuan` (approve request)
*   `/tolak_pengajuan` (reject request)
*   `/histori_alat` (equipment history)

## Role Vendor Maintenance

Vendor Maintenance is an external party or partner performing maintenance.

### Access:

*   Only view maintenance work assigned to that vendor.
*   Data is filtered by company/vendor name.
*   View equipment details related to vendor work.
*   View status of their own vendor work.

### Functions:

*   Check maintenance tasks.
*   Update maintenance progress.
*   Upload before photos.
*   Upload after photos.
*   Upload spare part photos.
*   Upload invoices.
*   Fill in work results.
*   Fill in work descriptions.

### Limitations:

*   Does not view all global equipment data.
*   Does not view data of other vendors.
*   Does not modify master equipment data except for work progress.
*   Does not manage calibration if their service is only maintenance.
*   Does not approve global users/requests.

### Operational Bot:

*   `/tugas_saya` (my tasks)
*   `/maintenance`
*   `/edit_maintenance`
*   `/upload_foto_sebelum` (upload before photo)
*   `/upload_foto_sesudah` (upload after photo)
*   `/upload_sparepart` (upload spare part)
*   `/upload_invoice` (upload invoice)

## Role Vendor Kalibrasi

Vendor Kalibrasi (Calibration Vendor) is an external party or partner performing calibration.

### Access:

*   Only view calibration work assigned to that vendor.
*   Data is filtered by company/vendor name.
*   View equipment details being calibrated.
*   View status of their own vendor calibration work.

### Functions:

*   Check calibration tasks.
*   Update calibration progress.
*   Upload measurement value photos.
*   Upload calibration certificates.
*   Fill in certificate number.
*   Fill in calibration results: Pass/Fail.
*   Fill in valid until date.

### Limitations:

*   Does not manage maintenance if their service is only calibration.
*   Does not view work of other vendors.
*   Does not modify master equipment data freely.
*   Does not approve global user/requests.

### Operational Bot:

*   `/tugas_saya` (my tasks)
*   `/kalibrasi`
*   `/edit_kalibrasi`
*   `/upload_nilai_ukur` (upload measurement value)
*   `/upload_sertifikat` (upload certificate)

## Pembagian Bot

### Operational Bot: `@InventarisAlkesOpenclaw_bot`

#### Functions:

*   Quick commands.
*   Light CRUD operations.
*   Equipment QR.
*   Equipment/room lists.
*   Maintenance.
*   Calibration.
*   Notifications.
*   Requests.
*   Photo/file uploads.

#### Not for:

*   Long AI chats.
*   Heavy analysis.
*   Free-form answers requiring extensive reasoning.

### AI Bot: `@AIAsistenInventaris_bot`

#### Functions:

*   Natural language Q&A.
*   Data summaries.
*   Inventory analysis.
*   Answering user/admin questions.
*   Admin uses OpenAI if available.
*   Regular users use Gemini.
*   If OpenAI quota is exhausted, fallback to Gemini.

#### Not for:

*   Directly modifying the database.
*   Deleting data.
*   Approving data.
*   Direct QR downloads.
*   For these actions, direct to the operational bot.

## Database Utama

### Tabel penting:

*   `ruangan`
*   `user_petugas`
*   `register_user`
*   `alat_kesehatan`
*   `maintenance`
*   `kalibrasi`
*   `mutasi_alat`
*   `pengajuan`
*   `notifikasi_teknisi`
*   `histori_alat`

### Relasi penting:

*   `alat_kesehatan.ruangan_id -> ruangan.id`
*   `maintenance.alat_id -> alat_kesehatan.id`
*   `kalibrasi.alat_id -> alat_kesehatan.id`
*   `mutasi_alat.alat_id -> alat_kesehatan.id`
*   `pengajuan.alat_id -> alat_kesehatan.id`
*   `notifikasi_teknisi.alat_id -> alat_kesehatan.id`

## Aturan UI Website

*   Website must be neat on desktop and mobile.
*   Do not make pages expand horizontally on mobile.
*   If tables have many columns, horizontal scrolling only within the table area.
*   Equipment list tables can have internal vertical scrolling.
*   Minimalist, clean, not too crowded display.
*   Do not add long explanatory text in the UI if unnecessary.
*   QR must be professional, scannable, and lead to the equipment detail page.
*   QR scan page must display equipment details, not short text.

## Aturan QR

*   Equipment QR must be different for each piece of equipment.
*   QR contains the equipment detail URL: `https://inventarisalkes-7f32c.web.app?qr=KODE_BARCODE`
*   After scanning, the user sees the equipment detail page:
    *   `nama alat` (equipment name)
    *   `barcode`
    *   `merk/tipe` (brand/type)
    *   `serial number`
    *   `ruangan` (room)
    *   `kondisi` (condition)
    *   `status`
    *   `perusahaan/vendor` (company/vendor)
    *   `tanggal instalasi` (installation date)
    *   `status kepemilikan` (ownership status)
    *   `maintenance history`
    *   `kalibrasi history` (calibration history)
    *   `mutasi history` (mutation history)

## Aturan Bot Lokal

Local bot will die if:

*   Laptop dies.
*   Laptop sleeps.
*   Node process is closed.
*   Network disconnection for a long time.
*   There is a Telegram polling conflict.