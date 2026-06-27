-- Update akun ZainTeknisi untuk registrasi Telegram.
-- Jalankan di Supabase SQL Editor jika update via API lokal sedang terblokir.

update public.user_petugas
set
  no_hp = '628137507126',
  telegram_id = concat_ws(
    ' ',
    nullif(telegram_id, ''),
    '628137507126'
  )
where username = 'ZainTeknisi';

select nama, username, role, no_hp, telegram_id, status
from public.user_petugas
where username = 'ZainTeknisi';
