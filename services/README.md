# services/

Pasta reservada para a integração com o backend/API da Alembro.

- `api.js` — client de exemplo (fetch wrapper) já esboçado, pronto pra ser plugado no formulário de contato do `index.html` no lugar do Formspree, assim que o backend existir.
- `mock-data.js` — dados fake (usuários, assinatura, faturas) usados pelo modal de login em `index.html` e pelo painel `pages/conta.html`. Não faz nenhuma chamada real; é só front-end. Quando o backend de contas existir, a ideia é trocar `mockLogin()` por uma chamada real via `api.js` que devolva `{ token, user }` no mesmo formato.

Conforme o backend crescer, dá pra adicionar aqui outros arquivos por domínio (ex: `auth.js`, `leads.js`) ou até transformar essa pasta num projeto Node separado (nesse caso, lembre de manter `node_modules/` e `.env` fora do git — já estão no `.gitignore` da raiz).
