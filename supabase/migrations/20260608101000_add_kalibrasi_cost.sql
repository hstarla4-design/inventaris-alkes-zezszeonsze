alter table public.kalibrasi
add column if not exists biaya_kalibrasi numeric;

update public.kalibrasi k
set biaya_kalibrasi = coalesce(
  k.biaya_kalibrasi,
  case
    when lower(coalesce(a.nama_alat, '')) like '%ventilator%' then 2500000
    when lower(coalesce(a.nama_alat, '')) like '%defibrillator%' then 2200000
    when lower(coalesce(a.nama_alat, '')) like '%monitor%' then 1800000
    when lower(coalesce(a.nama_alat, '')) like '%infusion%' then 950000
    when lower(coalesce(a.nama_alat, '')) like '%syringe%' then 950000
    when lower(coalesce(a.nama_alat, '')) like '%x-ray%' then 3500000
    when lower(coalesce(a.nama_alat, '')) like '%analyzer%' then 2800000
    else 1200000
  end
)
from public.alat_kesehatan a
where k.alat_id = a.id
  and k.biaya_kalibrasi is null;
