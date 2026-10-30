# Transportadora Braulio — app do motorista

App nativo (TypeScript + React Native + Expo) para registrar viagens:
data, veículo, KM, relato, gastos e comprovantes.

## Estrutura

```text
App.tsx                 # entrada e navegação
app.json                # config Expo / Android
assets/                 # ícones e logo
src/
  components/           # UI nativa compartilhada
  screens/              # telas do app
  services/             # regras de viagem
  lib/                  # storage, ids, supabase
  store.tsx             # estado global
  logic.ts              # helpers de domínio
  types.ts              # tipos
supabase/migrations/    # SQL do backend (opcional)
```

## Executar

```bash
npm install
cp .env.example .env   # opcional
npm start
```

No celular, abra com Expo Go. Em iPhone, faça login no CLI com a mesma conta:

```bash
npx expo login --no-browser -u sua_conta
npm run start:tunnel
```

Credenciais locais: motorista `1042`/`rota` · admin `9001`/`admin`

## Verificações

```bash
npm run typecheck
npm run build
```

## Supabase (opcional)

1. Aplique `supabase/migrations/001_viagens.sql`
2. Aplique `supabase/migrations/002_registro_simples.sql`
3. Preencha `.env` com `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Sem Supabase, os registros ficam neste aparelho.
