# PPCI Check IA

**Plataforma de pré-análise técnica de projetos de Prevenção e Combate a Incêndio (PPCI) com IA real.**

PPCI Check IA usa a API do Claude (Anthropic) para auditar plantas de PPCI conforme as Instruções Técnicas (ITs) do Corpo de Bombeiros Militar da Bahia (CBMBA). Você envia as pranchas (e opcionalmente o memorial descritivo); a IA identifica o enquadramento, audita cada sistema exigido, aponta divergências e atribui nota (0-10) e status de aprovação.

> ⚠️ **Importante:** PPCI Check IA é uma ferramenta de **apoio técnico**. Não substitui a análise oficial do Corpo de Bombeiros, o trabalho do profissional habilitado, nem garante a aprovação do projeto.

---

## ✨ Funcionalidades

- 🔐 Autenticação por e-mail/senha (Supabase Auth)
- 📋 Cadastro de projetos
- 📄 Upload de **múltiplas pranchas** (PDF, PNG, JPG) + memorial descritivo opcional
- 🤖 **Auditoria com IA real** (Claude Sonnet 4.5) baseada nas ITs do CBMBA
- 📊 Relatório com nota técnica (0-10), status de aprovação e sistemas auditados
- 🔍 Detecção automática de enquadramento (grupo, divisão, risco, processo PTS/PT)
- 🚨 Identificação de divergências entre planta e memorial
- 📚 Referências às Instruções Técnicas (IT-04, IT-11, IT-17, etc)
- 🗂️ Histórico de projetos com filtros

---

## 🛠️ Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Anthropic SDK** (`@anthropic-ai/sdk`) — análise com IA
- **Supabase** (Auth, Postgres, Storage, RLS)
- **Tailwind CSS** com design system customizado
- **Lucide React** para ícones

---

## 🚀 Setup local

### 1. Pré-requisitos

- Node.js 18.17+
- Conta no [Supabase](https://supabase.com) (gratuita)
- API key da [Anthropic](https://console.anthropic.com) (com saldo)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local`:

```bash
cp .env.local.example .env.local
```

Preencha com seus valores reais:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
ANTHROPIC_API_KEY=sk-ant-api03-...
```

⚠️ **Nunca commit `.env.local`** — ele já está no `.gitignore`.

### 4. Setup do Supabase

#### 4.1 Schema do banco

No SQL Editor do Supabase, execute o conteúdo de `supabase/schema.sql`. Isso cria:

- Tabelas: `users`, `projects`, `project_files`, `analyses`, `analysis_items`, `normatives`
- Campos da IA em `analyses`: `nota`, `status_aprovacao`, `grupo_ocupacao`, `divergencias`, etc
- Políticas de RLS em todas as tabelas
- Trigger para criar perfil ao registrar
- 8 normas pré-carregadas

#### 4.2 Bucket de storage

Crie o bucket `project-files` (privado) e adicione as policies do README anterior, OU rode o SQL abaixo:

```sql
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false);

create policy "Users can upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can read own files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);
```

#### 4.3 Auth

Em **Authentication → Providers → Email**, desmarque "Confirm email" para facilitar testes.

### 5. Rodar

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## 🤖 Como a análise com IA funciona

1. Usuário envia 1+ pranchas (PDF/PNG/JPG) + memorial opcional
2. Os arquivos vão para o Supabase Storage
3. O endpoint `/api/analyze` baixa os arquivos, codifica em base64
4. Envia para a API do Claude (`claude-sonnet-4-5-20250929`) com:
   - System prompt detalhado sobre auditoria PPCI (ITs do CBMBA)
   - Os PDFs/imagens das pranchas como `document`/`image` blocks
   - Instruções específicas (analisar em conjunto, identificar sistemas, etc)
5. Claude retorna JSON estruturado com:
   - Nota (0-10) e status ("Apto a protocolar", etc)
   - Enquadramento detectado (grupo, divisão, risco, processo)
   - Cada sistema exigido auditado (conforme / não conforme / pendente)
   - Divergências planta × memorial
   - Pendências e dados extraídos
6. Tudo é salvo no banco e exibido no relatório

### Modelo e custo

- Modelo: `claude-sonnet-4-5-20250929`
- Custo estimado por análise: **US$ 0.15 a US$ 0.80** (depende do tamanho das pranchas)
- Tempo: 30s a 2 min

---

## 📂 Estrutura

```
src/
├── app/
│   ├── api/analyze/route.ts          ← endpoint que chama a IA
│   ├── (auth)/                       ← login + cadastro
│   ├── dashboard/
│   ├── projetos/
│   │   ├── novo/
│   │   └── [id]/
│   │       ├── page.tsx              ← detalhes
│   │       ├── upload/               ← múltiplas pranchas + memorial
│   │       ├── analise/              ← chama /api/analyze
│   │       └── relatorio/            ← nota + status + sistemas
│   ├── historico/
│   └── planos/
├── components/
├── lib/
│   ├── analysis/
│   │   ├── ai-analyzer.ts            ← chamada à API do Claude
│   │   ├── prompts.ts                ← system prompt PPCI
│   │   ├── analyzer.ts               ← fallback de regras (legado)
│   │   └── normas/
│   │       ├── ocupacoes.ts          ← grupos A-J
│   │       ├── riscos.ts             ← LEVE/MOD/ELEV
│   │       └── sistemas-exigidos.ts  ← regras + PTS x PT
│   ├── supabase/
│   └── utils.ts
└── types/
```

---

## 🔐 Segurança

- Todas as chaves em variáveis de ambiente (`.env.local`)
- `ANTHROPIC_API_KEY` é **server-only** (sem prefixo `NEXT_PUBLIC_`), nunca exposta ao cliente
- Supabase RLS em todas as tabelas — usuário só vê os próprios dados
- Bucket de storage privado com policies por pasta de usuário

---

## 📜 Avisos legais

- Esta plataforma é uma ferramenta de **pré-análise técnica de apoio**
- **Não substitui** a análise oficial do Corpo de Bombeiros
- **Não substitui** o trabalho do profissional habilitado (ART/RRT)
- **Não garante** a aprovação do projeto pelos órgãos competentes
- A responsabilidade técnica final é sempre do projetista responsável
