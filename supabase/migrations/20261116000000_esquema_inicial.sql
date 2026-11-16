-- =====================================================================
-- Salud+ · Esquema inicial
-- Cada usuario solo puede ver y modificar SUS propios datos (RLS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- ---------------------------------------------------------------------
create table public.perfiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  nombre           text not null default '',
  apellido         text not null default '',
  fecha_nacimiento date,
  telefono         text,
  tipo_sangre      text check (tipo_sangre in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  alergias         text,
  avatar_url       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Citas médicas
-- ---------------------------------------------------------------------
create table public.citas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha        timestamptz not null,
  especialidad text not null,
  tipo         text not null default 'general' check (tipo in ('general','odontologia','especialista')),
  doctor       text,
  lugar        text,
  notas        text,
  recordatorio_minutos int default 60,
  completada   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index citas_user_fecha_idx on public.citas (user_id, fecha);

-- ---------------------------------------------------------------------
-- Medicamentos (tratamientos)
-- ---------------------------------------------------------------------
create table public.medicamentos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre       text not null,
  dosis        text not null,               -- ej. "500 mg"
  cantidad     text,                        -- ej. "1 tableta"
  horarios     time[] not null default '{}',-- horas del día: {08:00,20:00}
  dias_semana  smallint[],                  -- null = todos los días; 0=domingo … 6=sábado
  fecha_inicio date not null default current_date,
  fecha_fin    date,
  notas        text,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (fecha_fin is null or fecha_fin >= fecha_inicio)
);
create index medicamentos_user_idx on public.medicamentos (user_id) where activo;

-- Registro de tomas (adherencia al tratamiento)
create table public.tomas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  medicamento_id  uuid not null references public.medicamentos (id) on delete cascade,
  programada_para timestamptz not null,
  tomada_en       timestamptz,
  omitida         boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (medicamento_id, programada_para)
);
create index tomas_user_fecha_idx on public.tomas (user_id, programada_para);

-- ---------------------------------------------------------------------
-- Exámenes / expediente médico (archivo en Storage: bucket "examenes")
-- ---------------------------------------------------------------------
create table public.examenes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo       text not null,
  categoria    text not null default 'laboratorio'
               check (categoria in ('laboratorio','radiografia','ecografia','formula','diagnostico','otro')),
  fecha        date not null default current_date,
  archivo_path text,      -- ruta dentro del bucket: <user_id>/<archivo>
  mime_type    text,
  notas        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index examenes_user_fecha_idx on public.examenes (user_id, fecha desc);

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger perfiles_updated_at     before update on public.perfiles     for each row execute function public.set_updated_at();
create trigger citas_updated_at        before update on public.citas        for each row execute function public.set_updated_at();
create trigger medicamentos_updated_at before update on public.medicamentos for each row execute function public.set_updated_at();
create trigger examenes_updated_at     before update on public.examenes     for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Crear el perfil automáticamente al registrarse
-- (nombre/apellido llegan en options.data de signUp)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, apellido)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'apellido', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.perfiles     enable row level security;
alter table public.citas        enable row level security;
alter table public.medicamentos enable row level security;
alter table public.tomas        enable row level security;
alter table public.examenes     enable row level security;

-- Perfiles: solo el dueño (el insert lo hace el trigger)
create policy "perfil: ver el propio"        on public.perfiles for select to authenticated using ((select auth.uid()) = id);
create policy "perfil: actualizar el propio" on public.perfiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Tablas con user_id: CRUD solo sobre filas propias
create policy "citas: dueño" on public.citas
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "medicamentos: dueño" on public.medicamentos
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "examenes: dueño" on public.examenes
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tomas: dueño" on public.tomas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.medicamentos m where m.id = medicamento_id and m.user_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------
-- Storage: bucket privado para exámenes (máx. 20 MB; imágenes y PDF)
-- Los archivos se guardan como <user_id>/<nombre>
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('examenes', 'examenes', false, 20971520,
        array['image/jpeg','image/png','image/heic','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy "examenes: ver archivos propios" on storage.objects
  for select to authenticated
  using (bucket_id = 'examenes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "examenes: subir archivos propios" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'examenes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "examenes: actualizar archivos propios" on storage.objects
  for update to authenticated
  using (bucket_id = 'examenes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "examenes: borrar archivos propios" on storage.objects
  for delete to authenticated
  using (bucket_id = 'examenes' and (storage.foldername(name))[1] = (select auth.uid())::text);
