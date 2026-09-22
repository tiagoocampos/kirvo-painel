# KirvoAgenda — Painel do Lojista

Painel administrativo da barbearia: login, agenda de agendamentos, serviços, profissionais (com
expediente semanal), clientes e personalização. Arquitetura reaproveitada do painel do Alô Delivery
(mesma stack e mesmos padrões de `services`/`contexts`/layout), adaptada do domínio de pedidos de
delivery para o de agendamento.

React 19 + Vite 8 + TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · react-router-dom · axios ·
react-hook-form + zod · @tanstack/react-table · recharts. **Sem dark mode** (igual à referência).

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173 (ou a próxima porta livre)
```

```bash
# .env (opcional — ignorado pelo git; sem ele usa os valores abaixo)
VITE_BACKEND_API=http://localhost:3333
VITE_STOREFRONT_URL=http://localhost:5173
```

> Se o storefront (`saas-barbearia/storefront`) também estiver rodando em `5173`, o painel sobe em outra
> porta (o Vite escolhe automaticamente) — ajuste `VITE_STOREFRONT_URL` se precisar.

O backend precisa ter a origem do painel em `ALLOWED_ORIGINS` (CORS).

## O que já funciona de ponta a ponta

Login e cadastro (`POST /login`, `POST /register`), recuperação de senha (`POST /auth/forgot-password`,
`POST /auth/reset-password`), dados da própria barbearia (`GET /tenant/me`, `PUT /tenant/me`) incluindo
upload de logo/banner/favicon, todo o CRUD de **Serviços** e **Profissionais** (incluindo o editor de
expediente semanal, `PUT /professionals/:id/working-hours`), a **Agenda** do painel (`GET /appointments`
e as ações de status/cancelamento), o **Dashboard** (`/dashboard/summary`, `/dashboard/revenue`) e a
listagem de **Clientes** (`GET /customers`, `GET /customers/:id/appointments`).

## Decisões de design

- **Agenda em vez de quadro/Kanban** (`AgendamentosPage`): ao contrário do painel de pedidos do Alô
  Delivery (colunas por status), a agenda do Kirvo mostra uma coluna por profissional ativo com os
  agendamentos posicionados pelo horário do dia (`AgendaDayView`) — mais parecido com a agenda real de
  uma barbearia. A faixa de horário exibida se ajusta ao expediente cadastrado dos profissionais daquele
  dia da semana (com margem de 15 min), e não depende de nenhum endpoint de resumo separado: os cards do
  dia (total, concluídos, cancelados, faturamento) são calculados a partir da mesma lista de
  agendamentos já carregada.
- **Fuso da barbearia, não do navegador**: `lib/dates.ts` converte os instantes UTC do backend para o
  relógio local da barbearia (`Tenant.timezone`) — mesmo princípio já usado no backend e no storefront.
- **Identidade visual própria**: paleta neutra cinza-azulado (mesma família do storefront), sem o azul
  de marca do Alô Delivery nem o preto-e-branco da landing institucional. Sem dark mode, por pedido.
- **Exclusão de serviço/profissional**: adicionada ao CRUD (não pedida explicitamente, mas o backend já
  suporta com a regra "recusa se houver agendamento vinculado, sugere desativar em vez de excluir") —
  pareceu inconsistente ter o formulário de edição sem uma forma de remover um cadastro feito por engano.
- **Ajuste pequeno no backend**: `GetMyTenantService` não selecionava `minCancelHoursBefore` (a coluna
  existe desde a fase de agendamento, só nunca tinha sido exposta por `/tenant/me`). Adicionei ao
  `select` — mudança aditiva, não quebra nada que já consumia essa rota.
