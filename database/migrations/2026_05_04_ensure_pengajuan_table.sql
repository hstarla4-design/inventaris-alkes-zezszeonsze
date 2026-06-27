do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'pengajuan'
  ) then
    execute $q$
      create table public.pengajuan (
        id uuid primary key default gen_random_uuid(),
        jenis_pengajuan text,
        kategori text,
        alat_id uuid references public.alat_kesehatan(id) on delete cascade,
        ruangan_id uuid references public.ruangan(id),
        vendor_pt text,
        catatan text,
        dibuat_oleh text,
        dibuat_oleh_role text,
        tujuan_role text,
        status text default 'Draft',
        created_at timestamp default now()
      )
    $q$;
  end if;

  execute 'alter table public.pengajuan enable row level security';
  perform pg_notify('pgrst', 'reload schema');
end $$;
