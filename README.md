# Match

Lote diário e caminho até um encontro. Este repositório é só do Match: banco, sessão e mídia não são compartilhados com outro produto.

A conferência de idade, o Plus e a verificação são simulados. Isso não substitui provedor de idade, pagamento de loja nem parecer jurídico. O OpCore Compliance fica como provedor futuro, sem chamada nesta versão.

## Subir

Node 22 ou mais novo. Com Docker:

```bash
cp .env.example .env
docker compose up -d
```

Crie os papéis `match_migrator` e `match_app` no Postgres da porta 5433 e preencha `MIGRATE_URL` e `DATABASE_URL` no `.env`. `SEED_ADMIN_PASSWORD` e `SEED_DEMO_PASSWORD` são obrigatórias. O seed recusa `NODE_ENV=production`.

Sem Docker, nesta máquina:

```bash
npm run db:up
```

Esse comando sobe um Postgres 18 embutido em `127.0.0.1:5433` e cria o `.env` local se ele ainda não existir. Deixe o processo aberto.

Em outro terminal:

```bash
npx prisma migrate dev --name init
npm run db:grant
npm run db:seed
npm run dev
```

O site abre em `http://localhost:3100`. O cookie de sessão não sai se o endereço for `127.0.0.1`.

Contas do seed local: `marina@exemplo.local` e `admin@exemplo.local`, com as senhas que você colocou no `.env`.

## O que a Marina encontra

Um lote estável no dia de São Paulo, distância em faixa, sinal, conversa por HTTP, denúncia depois de encerrar, e o encontro só quando os dois marcam. Bloquear, denunciar e a faixa de distância ficam no plano gratuito.

A conversa vazia abre com três puxadores tirados dos interesses em comum (`src/domain/starters.ts`); sem nota de beleza, sem probabilidade. Quando o lugar público está marcado, a tela do encontro mostra um texto pronto para copiar e mandar a alguém de confiança. O Match não envia essa mensagem: quem manda é a pessoa.

Quem não participa da conversa recebe 404. O mesmo vale para mensagem e denúncia ligadas a esse match.

## Rotas

Todas as mutações são `POST` com formulário, checagem de `Origin` e corpo de até 20 KB.

| Rota | Uso |
| --- | --- |
| `/api/auth/cadastrar` | conta nova, idade simulada |
| `/api/auth/entrar` | sessão |
| `/api/auth/sair` | encerra a sessão |
| `/api/lote` | sinal ou passe; campo `chave` |
| `/api/conversa` | mensagem, encerrar, denunciar, bloquear |
| `/api/encontro` | querer, janela, lugar público |
| `/api/perfil` | texto do perfil |
| `/api/plus` | Plus simulado; campo `chave` |
| `/api/seguranca` | bloqueio fora da conversa |
| `/api/admin` | revisar denúncia |
| `/api/conta` | apagar a conta neste produto |
