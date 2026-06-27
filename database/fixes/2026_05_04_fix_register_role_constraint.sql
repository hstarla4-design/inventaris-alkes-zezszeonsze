do $$
begin
  execute 'alter table public.register_user drop constraint if exists register_user_role_check';
  execute 'alter table public.register_user add constraint register_user_role_check check (role in (''Admin'', ''Teknisi'', ''Kepala Ruangan'', ''Kepala Supervisor'', ''Vendor''))';
  execute 'alter table public.user_petugas drop constraint if exists user_petugas_role_check';
  execute 'alter table public.user_petugas add constraint user_petugas_role_check check (role in (''Admin'', ''Teknisi'', ''Kepala Ruangan'', ''Kepala Supervisor'', ''Vendor''))';
  execute 'update public.register_user set role = ''Kepala Supervisor'' where role in (''Supervisor'', ''Kepala Unit'')';
  execute 'update public.user_petugas set role = ''Kepala Supervisor'' where role in (''Supervisor'', ''Kepala Unit'')';
end $$;
