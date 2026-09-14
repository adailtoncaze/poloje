# PoloJE — Gestão e Monitoramento de Polos de Contingência e Transmissão

Aplicação web (Next.js + Tailwind CSS + Supabase) para a **10ª Zona Eleitoral
de Guarabira**, com painel de KPIs, cards operacionais de cada PCT, cadastro
completo via drawer lateral, e emissão de fichas/relatórios em PDF. Interface
em **light mode**.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** para estilização
- **Supabase** (Postgres + Auth) — login gerenciado pelo Supabase Auth
- **jsPDF / jspdf-autotable** para geração de PDFs no navegador

## 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, execute o conteúdo de `supabase/schema.sql`. Isso cria:
   - Tabelas: `profiles`, `alvts`, `pcts`, `locais_vinculados`
   - Views: `vw_pcts_totais` (soma seções próprias + vinculadas) e
     `vw_kpis_gerais` (KPIs do painel geral)
   - Políticas de RLS (Row Level Security) exigindo usuário autenticado
   - Trigger que cria automaticamente um `profile` ao registrar um usuário

   > **Já tem um banco criado com a versão anterior do schema** (que incluía
   > a tabela `zonas_eleitorais`)? Rode `supabase/migration_remove_zona.sql`
   > em vez de recriar tudo do zero — a aplicação agora atende exclusivamente
   > a **10ª Zona Eleitoral de Guarabira**, então essa tabela não é mais
   > necessária.
3. Em **Authentication → Providers**, habilite o provedor **Email** (login
   por e-mail/senha). Você pode desabilitar confirmação de e-mail em
   ambientes de teste, em **Authentication → Settings**.
4. Crie os usuários (servidores/colaboradores) em **Authentication → Users**,
   ou habilite auto-cadastro conforme a política da sua Zona Eleitoral.
5. Copie a **Project URL** e a **anon public key** em
   **Project Settings → API**.

## 2. Configurar o projeto localmente

```bash
cp .env.local.example .env.local
# edite .env.local com as credenciais do seu projeto Supabase
npm install
npm run dev
```

Acesse `http://localhost:3000` — você será redirecionado para `/login`.

## 3. Estrutura do projeto

```
app/
  layout.tsx          Layout raiz
  page.tsx            Dashboard (painel geral + cards + filtros)
  login/page.tsx       Tela de login (Supabase Auth)
components/
  KpiPanel.tsx         Contadores consolidados (KPIs)
  PctCard.tsx          Card visual de cada PCT
  NewPctDrawer.tsx     Drawer lateral de cadastro de novo PCT
  StatusBadge.tsx      Selo de prontidão de transmissão
  Header.tsx           Busca, filtros e ações (novo PCT / exportar PDF)
lib/
  types.ts             Tipos TypeScript compartilhados
  pdf.ts               Geração de Ficha PDF individual e Relatório Consolidado
  supabase/
    client.ts          Cliente Supabase (Client Components)
    server.ts           Cliente Supabase (Server Components)
middleware.ts           Protege rotas exigindo sessão válida
supabase/
  schema.sql                 Schema completo (tabelas, views, RLS, trigger)
  migration_remove_zona.sql  Migração p/ bancos criados com a versão antiga do schema
```

## 4. Funcionalidades implementadas

- **Painel Geral**: PCTs ativos, seções atendidas (com % de cobertura),
  locais de votação vinculados, % de ALVTs treinados e homologados.
- **Cards de PCT**: identificação, selo de prontidão, endereço com ponto de
  referência, capacidade de transmissão (seções próprias x vinculadas),
  lista de locais satélites, responsável ALVT e ações rápidas (Ficha PDF,
  Editar, Mapear).
- **Cadastro de novo PCT**: identificação, localização, responsável ALVT
  (existente ou novo, com validação básica de CPF), escopo de seções
  próprias/satélites com **cálculo automático da carga total**, e
  observações técnicas (conectividade, no-break, homologação de rede).
- **Exportação em PDF**: ficha individual por PCT e relatório consolidado
  de todos os PCTs (filtrados) para auditoria/logística, gerados no
  navegador via `jsPDF`.

## 5. Próximos passos sugeridos

- Implementar a ação **Editar** (reaproveitando o `NewPctDrawer` em modo edição).
- Implementar **Mapear** com integração a um provedor de mapas (ex: Google Maps/Mapbox).
- Adicionar papéis de usuário (ex: `admin`, `zona`) refinando as políticas de RLS.
- Adicionar upload de foto/crachá do ALVT via Supabase Storage.
