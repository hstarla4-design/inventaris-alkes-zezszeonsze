alter table public.alat_kesehatan
  add column if not exists tingkat_risiko text default 'Sedang',
  add column if not exists preventive_terakhir date,
  add column if not exists preventive_berikutnya date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'alat_kesehatan_tingkat_risiko_check'
  ) then
    alter table public.alat_kesehatan
      add constraint alat_kesehatan_tingkat_risiko_check
      check (tingkat_risiko in ('Tinggi', 'Sedang', 'Rendah'));
  end if;
end
$$;

update public.alat_kesehatan
set tingkat_risiko = case
  when lower(coalesce(nama_alat, '')) ~
    '(ventilator|defibrillator|anestesi|patient monitor|monitor pasien|infusion pump|syringe pump|incubator|infant warmer|c-arm)'
    then 'Tinggi'
  when lower(coalesce(nama_alat, '')) ~
    '(ecg|usg|ultrasound|suction|sterilizer|autoclave|analyzer|centrifuge|phototherapy|pulse oximeter|capnograph)'
    then 'Sedang'
  else 'Rendah'
end
where tingkat_risiko is null
   or tingkat_risiko not in ('Tinggi', 'Sedang', 'Rendah')
   or tingkat_risiko = 'Sedang';

update public.alat_kesehatan
set preventive_terakhir = coalesce(preventive_terakhir, maintenance_terakhir)
where preventive_terakhir is null;

update public.alat_kesehatan
set preventive_berikutnya = coalesce(
  preventive_berikutnya,
  maintenance_berikutnya,
  case tingkat_risiko
    when 'Tinggi' then preventive_terakhir + interval '1 month'
    when 'Sedang' then preventive_terakhir + interval '3 months'
    else preventive_terakhir + interval '6 months'
  end
)::date
where preventive_berikutnya is null;

comment on column public.alat_kesehatan.tingkat_risiko is
  'Klasifikasi interval preventive: Tinggi 1 bulan, Sedang 3 bulan, Rendah 6 bulan.';
comment on column public.alat_kesehatan.preventive_terakhir is
  'Tanggal preventive maintenance terakhir.';
comment on column public.alat_kesehatan.preventive_berikutnya is
  'Tanggal preventive maintenance berikutnya berdasarkan tingkat risiko.';
