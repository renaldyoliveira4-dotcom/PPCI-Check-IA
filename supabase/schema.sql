-- =====================================================
-- PPCI Check IA - Schema do banco de dados
-- =====================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- =====================================================
-- Tabela: users (perfis de usuário)
-- =====================================================
-- Observação: auth.users é gerenciada pelo Supabase Auth.
-- Esta tabela armazena o perfil público do usuário.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- Tabela: projects
-- =====================================================
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  client_name text,
  city text,
  state text,
  occupancy_type text,
  built_area numeric(12,2),
  floors integer,
  status text not null default 'draft' check (status in ('draft', 'uploaded', 'analyzing', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_status_idx on public.projects(status);

-- =====================================================
-- Tabela: project_files
-- =====================================================
create table if not exists public.project_files (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null,
  file_size bigint,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists project_files_project_id_idx on public.project_files(project_id);

-- =====================================================
-- Tabela: analyses
-- =====================================================
create table if not exists public.analyses (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  score integer not null default 0 check (score >= 0 and score <= 100),
  summary text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  total_items integer default 0,
  conforming_items integer default 0,
  warning_items integer default 0,
  non_conforming_items integer default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists analyses_project_id_idx on public.analyses(project_id);

-- =====================================================
-- Tabela: analysis_items
-- =====================================================
create table if not exists public.analysis_items (
  id uuid primary key default uuid_generate_v4(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  category text not null,
  status text not null check (status in ('conforme', 'atencao', 'nao_conforme')),
  description text not null,
  recommendation text,
  normative_reference text,
  risk_level text not null check (risk_level in ('baixo', 'medio', 'alto')),
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists analysis_items_analysis_id_idx on public.analysis_items(analysis_id);
create index if not exists analysis_items_status_idx on public.analysis_items(status);

-- =====================================================
-- Tabela: normatives (base de normas)
-- =====================================================
create table if not exists public.normatives (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  title text not null,
  description text,
  scope text,
  state text,
  created_at timestamptz not null default now()
);

-- Carga inicial de normas
insert into public.normatives (code, title, description, scope, state) values
  ('DEC-16302-2015', 'Decreto Estadual nº 16.302/2015', 'Regulamenta a Lei nº 12.929/2013 sobre segurança contra incêndio e pânico no Estado da Bahia.', 'estadual', 'BA'),
  ('IT-42', 'IT-42 - Projeto Técnico Simplificado', 'Estabelece critérios para projetos técnicos simplificados de PPCI.', 'nacional', null),
  ('IT-11', 'IT-11 - Saídas de Emergência', 'Define requisitos para dimensionamento e disposição de saídas de emergência.', 'nacional', null),
  ('IT-18', 'IT-18 - Iluminação de Emergência', 'Especifica iluminação de emergência em edificações.', 'nacional', null),
  ('IT-20', 'IT-20 - Sinalização de Emergência', 'Define a sinalização de segurança contra incêndio.', 'nacional', null),
  ('IT-21', 'IT-21 - Extintores de Incêndio', 'Estabelece critérios de distribuição e capacidade extintora.', 'nacional', null),
  ('IT-22', 'IT-22 - Sistema de Hidrantes e Mangotinhos', 'Requisitos para sistemas de hidrantes e mangotinhos.', 'nacional', null),
  ('IT-25', 'IT-25 - Segurança contra Incêndio em Líquidos Inflamáveis', 'Critérios para edificações que armazenam líquidos inflamáveis.', 'nacional', null)
on conflict (code) do nothing;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- users
alter table public.users enable row level security;

create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- projects
alter table public.projects enable row level security;

create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can insert own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- project_files
alter table public.project_files enable row level security;

create policy "Users can view files of own projects" on public.project_files
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can insert files in own projects" on public.project_files
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can delete files of own projects" on public.project_files
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id and p.user_id = auth.uid()
    )
  );

-- analyses
alter table public.analyses enable row level security;

create policy "Users can view analyses of own projects" on public.analyses
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = analyses.project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can insert analyses for own projects" on public.analyses
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = analyses.project_id and p.user_id = auth.uid()
    )
  );

create policy "Users can update analyses of own projects" on public.analyses
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = analyses.project_id and p.user_id = auth.uid()
    )
  );

-- analysis_items
alter table public.analysis_items enable row level security;

create policy "Users can view items of own analyses" on public.analysis_items
  for select using (
    exists (
      select 1 from public.analyses a
      join public.projects p on a.project_id = p.id
      where a.id = analysis_items.analysis_id and p.user_id = auth.uid()
    )
  );

create policy "Users can insert items for own analyses" on public.analysis_items
  for insert with check (
    exists (
      select 1 from public.analyses a
      join public.projects p on a.project_id = p.id
      where a.id = analysis_items.analysis_id and p.user_id = auth.uid()
    )
  );

-- normatives (leitura pública)
alter table public.normatives enable row level security;

create policy "Anyone authenticated can read normatives" on public.normatives
  for select using (auth.role() = 'authenticated');

-- =====================================================
-- Trigger: criar perfil ao criar conta
-- =====================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- Storage: bucket para PDFs
-- =====================================================
-- Executar no SQL Editor:
-- insert into storage.buckets (id, name, public) values ('project-files', 'project-files', false);

-- Políticas do storage (após criar o bucket):
-- create policy "Users can upload files to own folder"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'project-files'
--     and (storage.foldername(name))[1] = auth.uid()::text
--   );

-- create policy "Users can read own files"
--   on storage.objects for select
--   using (
--     bucket_id = 'project-files'
--     and (storage.foldername(name))[1] = auth.uid()::text
--   );

-- create policy "Users can delete own files"
--   on storage.objects for delete
--   using (
--     bucket_id = 'project-files'
--     and (storage.foldername(name))[1] = auth.uid()::text
--   );
