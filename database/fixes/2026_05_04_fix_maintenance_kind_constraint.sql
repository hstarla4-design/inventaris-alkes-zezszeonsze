do $$
begin
  execute 'alter table public.maintenance drop constraint if exists maintenance_jenis_check';
  execute 'update public.maintenance set jenis = ''Emergency (Breakdown)'' where jenis = ''Inspection''';
  execute 'update public.maintenance set jenis = ''Corrective Ringan'' where jenis = ''Corrective''';
  execute 'alter table public.maintenance add constraint maintenance_jenis_check check (jenis in (''Preventive'', ''Corrective Ringan'', ''Corrective Berat'', ''Emergency (Breakdown)''))';
  perform pg_notify('pgrst', 'reload schema');
end $$;
