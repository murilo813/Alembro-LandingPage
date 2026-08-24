# services/

Pasta reservada para a integração com o backend/API da Alembro.

- `api.js` — client real do backend do Alembro FLOW (`https://api.alembro.com`, repositório `AlembroFLOWbackend`). Login, sessão, empresas, planos, assinatura e faturas — tudo real, inclusive cobrança via Asaas; `sendContactLead` continua um exemplo esboçado (o formulário de contato ainda vai direto pro Formspree).
- `account.js` — utilitários que não são chamada de API: metadados visuais dos apps (`APPS`), formatação de moeda, o cálculo do plano Personalizado e os wrappers de sessão em localStorage. Sem dado fake nenhum, apesar de já ter se chamado `mock-data.js`.

Conforme o backend crescer, dá pra adicionar aqui outros arquivos por domínio (ex: `auth.js`, `leads.js`) ou até transformar essa pasta num projeto Node separado (nesse caso, lembre de manter `node_modules/` e `.env` fora do git — já estão no `.gitignore` da raiz).
