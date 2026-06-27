update public.alat_kesehatan
set tingkat_risiko = 'Tinggi'
where lower(coalesce(nama_alat, '')) ~
  '(ventilator|defibrillator|anestesi|patient monitor|monitor pasien|bedside monitor|infusion pump|syringe pump|incubator|infant warmer|c-arm)';

update public.alat_kesehatan
set preventive_berikutnya = case tingkat_risiko
  when 'Tinggi' then preventive_terakhir + interval '1 month'
  when 'Sedang' then preventive_terakhir + interval '3 months'
  else preventive_terakhir + interval '6 months'
end,
maintenance_berikutnya = case tingkat_risiko
  when 'Tinggi' then preventive_terakhir + interval '1 month'
  when 'Sedang' then preventive_terakhir + interval '3 months'
  else preventive_terakhir + interval '6 months'
end
where preventive_terakhir is not null;
