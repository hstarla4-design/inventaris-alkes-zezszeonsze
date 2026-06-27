select r.kode_ruangan, r.nama_ruangan, a.nama_alat, a.kode_barcode, a.created_at
from public.alat_kesehatan a
join public.ruangan r on r.id = a.ruangan_id
order by a.created_at desc
limit 12;
