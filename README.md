# Transportadora Braulio — app do motorista

Aplicativo nativo Android feito com TypeScript, React Native e Expo. O motorista registra
data, veículo, quilometragem, relato, gastos e fotos de comprovantes em uma única tela.

## Recursos

- funcionamento offline com persistência no aparelho (AsyncStorage);
- captura de comprovantes pela câmera;
- rascunhos e histórico de viagens;
- fluxo de conferência para administradores;
- cliente Supabase preparado para sessão persistente;
- interface nativa em tema escuro, otimizada para Android.

## Executar no Android

Requisitos: Node.js e o app Expo Go em um aparelho Android, ou Android Studio com um emulador.

```bash
npm install
cp .env.example .env # opcional
npm run start
```

Leia o QR Code com o Expo Go. Para abrir diretamente em um emulador já iniciado:

```bash
npm run android
```

Credenciais locais:

- motorista: `1042` / `rota`
- administrador: `9001` / `admin`

## Verificações

```bash
npm run typecheck
npm run build
```

`npm run build` gera o bundle Android em `dist/`. Para criar APK/AAB de produção, configure
o EAS Build com a conta Expo do projeto.

## Supabase

1. Aplique `supabase/migrations/001_viagens.sql`.
2. Aplique `supabase/migrations/002_registro_simples.sql`.
3. Copie `.env.example` para `.env` e informe a URL e a chave publicável (ou `anon`).

Nunca coloque uma chave `service_role` no aplicativo. Sem Supabase configurado, os registros
continuam disponíveis apenas neste aparelho.
