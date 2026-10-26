# Transportadora Braulio — sistema do motorista

Formulário único **Registrar viagem**: data, motorista, veículo, KM, relato, gastos e comprovantes.

## Rodar

```bash
npm install
cp .env.example .env   # opcional: Supabase
npm run dev
```

Demo local: motorista `1042`/`rota` · admin `9001`/`admin`

## Supabase

1. Rode `supabase/migrations/001_viagens.sql`
2. Depois `supabase/migrations/002_registro_simples.sql` (aditivo: `rascunho`, `trip_date`, `relato`, `trip_attachments`)
3. Preencha `.env`

Sem Supabase, os registros ficam neste aparelho e o app deixa isso explícito.
