# Transportadora Braulio — sistema do motorista

Registro de viagens agregadas: início com KM, entregas, gastos com comprovantes, finalização e conferência administrativa.

## Rodar

```bash
npm install
cp .env.example .env   # opcional: preencha Supabase
npm run dev
```

### Demo local (sem inventar viagens)

- Motorista: matrícula `1042`, senha `rota`
- Admin: matrícula `9001`, senha `admin`

Sem `VITE_SUPABASE_*`, os registros ficam **neste aparelho** e o app deixa isso explícito. Não há viagens fictícias pré-carregadas.

### Supabase

1. Crie o projeto e rode `supabase/migrations/001_viagens.sql`
2. Preencha `.env` com URL e anon key
3. Bucket `comprovantes` (já no SQL)

## PWA

Instalável no celular (Android/iOS) via aviso do app ou “Adicionar à Tela de Início”.
