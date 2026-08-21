# services/

Pasta reservada para a integração com o backend/API da Alembro.

- `api.js` — client real do backend do Alembro FLOW (`https://api.alembro.com`, repositório `AlembroFLOWbackend`). Login, sessão, empresas (uso real) e edição de nome já são reais; `sendContactLead` continua um exemplo esboçado (o formulário de contato ainda vai direto pro Formspree).
- `mock-data.js` — só o plano em si (nome, valor, faturas) ainda é fake, usado pelo painel `pages/conta.html`. Identidade, empresas/uso e status de assinante/trial já vêm de verdade do backend (`api.js`); o resto continua mock até existir cobrança de verdade no backend.

Conforme o backend crescer, dá pra adicionar aqui outros arquivos por domínio (ex: `auth.js`, `leads.js`) ou até transformar essa pasta num projeto Node separado (nesse caso, lembre de manter `node_modules/` e `.env` fora do git — já estão no `.gitignore` da raiz).
