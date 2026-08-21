# services/

Pasta reservada para a integração com o backend/API da Alembro.

- `api.js` — client de exemplo (fetch wrapper) já esboçado, pronto pra ser plugado no formulário de contato do `index.html` no lugar do Formspree, assim que o backend existir.

Conforme o backend crescer, dá pra adicionar aqui outros arquivos por domínio (ex: `auth.js`, `leads.js`) ou até transformar essa pasta num projeto Node separado (nesse caso, lembre de manter `node_modules/` e `.env` fora do git — já estão no `.gitignore` da raiz).
