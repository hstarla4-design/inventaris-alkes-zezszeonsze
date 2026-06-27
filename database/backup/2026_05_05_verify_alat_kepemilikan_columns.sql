select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'alat_kesehatan'
  and column_name in (
    'status_kepemilikan',
    'kso_nama_partner',
    'kso_tipe_kerja_sama',
    'kso_fee_tetap',
    'kso_tanggal_mulai',
    'kso_tanggal_akhir',
    'kso_file_kontrak',
    'sewa_vendor_leasing',
    'sewa_biaya_per_bulan',
    'sewa_durasi_kontrak',
    'sewa_tanggal_mulai',
    'sewa_tanggal_akhir',
    'sewa_buyback',
    'sewa_file_kontrak'
  )
order by column_name;
