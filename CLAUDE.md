# Alembro — Landing Page

Landing page estática (HTML/CSS/JS puro, sem build step, sem framework) hospedada no GitHub Pages com domínio próprio (`alembro.com`, ver `CNAME`). Publicada em https://murilo813.github.io/Alembro-LandingPage/.

## Estrutura

```
index.html, 404.html, CNAME, robots.txt, sitemap.xml   (raiz — exigido pelo GitHub Pages)
pages/
  privacy.html    política de privacidade
  delete.html     solicitação de exclusão de conta (Alembro APP e STOCK)
  thanks.html     página de agradecimento pós-contato
  conta.html      painel de conta do Alembro FLOW (login/sessão/empresas/assinante reais, só plano/faturas mock — ver seção abaixo)
assets/
  images/         favicon e .webp usados no index
  css/            styles.css — hoje não usado; todo CSS do site é inline em <style> dentro de cada HTML
services/
  api.js          client real do backend do FLOW (login, sessão, empresas, update de nome) + exemplo pro formulário de contato
  mock-data.js    dados fake do plano/faturas do FLOW (ver seção abaixo)
```

Cada página HTML é autocontida: tem seu próprio `<style>` inline com os design tokens redeclarados (não existe um stylesheet compartilhado de fato, apesar de `assets/css/styles.css` existir). Ao criar uma página nova, siga esse padrão — copie os tokens de `:root` de uma página existente em vez de tentar centralizar.

**`index.html` e `404.html` precisam continuar na raiz** — é onde o GitHub Pages procura por eles.

**Não renomeie `pages/delete.html` nem `pages/privacy.html`.** Essas URLs (`https://alembro.com/pages/delete.html` e `.../privacy.html`) provavelmente estão cadastradas na App Store Connect / Google Play Console (link de exclusão de conta e política de privacidade exigidos por política das lojas) e em `sitemap.xml`. Renomear quebra esses links cadastrados fora deste repositório.

## Os 3 produtos e suas cores

Cada produto tem identidade visual própria — **não misture as cores entre eles**:

| Produto | Cor | Uso |
|---|---|---|
| Alembro APP (força de vendas / CRM) | `--app-gradient` (verde→teal, gradiente) | `.app-gradient-text`, `.btn-app-solid` |
| Alembro STOCK (controle de estoque) | `--stock-gradient` (azul, gradiente) | `.stock-gradient-text`, `.btn-stock-solid` |
| Alembro FLOW (gestão administrativa, produto novo/independente) | `--flow-green` (`#16A34A`, **sólido**, sem gradiente) | badges, botões e avatares do FLOW |

Erro comum já cometido nesta base: usar `--app-gradient` em elementos do FLOW porque as duas cores são "esverdeadas". São produtos diferentes — FLOW é sempre cor sólida.

Design tokens completos (declarados em `:root` de cada página):

```css
--bg-color: #0f1115;      --bg-card: #1a1d24;
--text-main: #f8fafc;     --text-dim: #94a3b8;
--primary: #3b82f6;       --primary-hover: #2563eb;
--accent: #8b5cf6;        --success: #10b981;
--flow-green: #16A34A;
--app-gradient: linear-gradient(45deg, #15803D 0%, #16A34A 50%, #049271 100%);
--stock-gradient: linear-gradient(45deg, #003366 0%, #0056A3 50%, #3399FF 100%);
--border: #2dd4bf20;
```

Fontes: Inter (texto) e Montserrat (títulos), via Google Fonts. Ícones: Font Awesome 6 via cdnjs. Tema é dark-only (sem light mode). Site inteiro é responsivo com media queries por página.

## Sistema de login/conta do Alembro FLOW

STOCK e APP compartilham a mesma conta/login e já têm um fluxo real (login + exclusão de conta) em `pages/delete.html`, batendo num backend diferente (`weberp.alembro.com`). Por isso, no modal de login (`index.html`), clicar em STOCK ou APP pula direto pra `pages/delete.html`.

**Alembro FLOW tem login/sessão/empresas/status de assinante reais** (contra o `AlembroFLOWbackend`, ver seção abaixo). **Só o plano em si continua mock** (`services/mock-data.js`) — nome do plano, valor, faturas — porque o backend não tem cobrança ainda. `buildAccountSession()` é o ponto de junção: pega a identidade real (nome/e-mail/token, do login) e anexa por cima o pacote de plano fake, no formato que `pages/conta.html` já espera; empresas e status de assinante/trial são preenchidos à parte, com dados reais, logo depois (ver "Sessão" abaixo).

**Não existe registro/criação de conta no site — decisão deliberada, não esquecimento.** O site é só gerenciamento de quem já é usuário do app; criar conta acontece dentro do Alembro FLOW (mobile/desktop). Já existiu uma tela de registro aqui (mock) e foi removida de propósito. Se pedirem pra "adicionar cadastro" de novo, confirme antes — pode ser um pedido genuíno de mudança de escopo, não a reintrodução do que já foi tirado.

### Por que os scripts não usam `import`/`export`

`services/mock-data.js` e `services/api.js` expõem tudo via `window.AlembroMockData`/`window.AlembroAPI` (IIFE clássica), **não** via ES modules. Isso é proposital: o site precisa continuar funcionando quando alguém abre `index.html` direto do disco (`file://`), e módulos ES são bloqueados por CORS nesse cenário. Scripts comuns (`<script src="...">`, sem `type="module"`) não têm essa restrição.

**Para testar mudanças, sirva os arquivos por HTTP** (`python -m http.server` na raiz do projeto) em vez de confiar só em abrir o arquivo direto — mais fácil de depurar e mais parecido com produção, embora `file://` também deva continuar funcionando. **Não dispare chamadas reais pro backend de produção (`api.alembro.com`) sem que o dono do projeto peça** — login/sessão já são reais, então testar sem cuidado (ex: automatizando login) bate direto na base de produção.

### Sessão: `localStorage` + token na URL como fallback + validação real no load

A sessão (`{ token, user }`) fica em `localStorage` (`alembro-mock-session` — nome ficou desatualizado mas é o que tem; `user` mistura identidade real com o pacote mock).

**Achado real (não hipótese) rodando em Firefox com `file://`**: `index.html` e `pages/conta.html` não enxergam o mesmo `localStorage` — o Firefox isola storage por arquivo em `file://`, diferente de Chrome. Sem tratamento pra isso, o login funcionava (200) e a página até navegava pra `pages/conta.html`, mas lá dentro `getMockSession()` voltava `null` e ela batia em silêncio de volta pro `index.html` — sem erro, sem chamar `/web/session`, dando a impressão de "não faz nada". **Solução**: `index.html` manda o token de sessão também pela URL (`pages/conta.html?app=flow&token=...`) ao navegar depois do login — não é "reconstruir" um JWT a partir da URL (isso de fato não dá), é só levar adiante o mesmo token que o login já gerou. `pages/conta.html` usa esse `token` da URL como fallback quando `getMockSession()` não acha nada, tira o token da URL imediatamente (`history.replaceState`, não deixa JWT parado na barra de endereço) e valida ele contra `/web/session` do mesmo jeito. **Se mexer nesse fluxo de novo, teste em file:// no Firefox de propósito** — é o cenário que expôs isso; testar só via `http://127.0.0.1` (onde storage não é isolado) não pega esse tipo de bug.

Fluxo em `pages/conta.html` (fora do modo visitante):

1. Lê a sessão salva (`localStorage`); se não achar e tiver `?token=` na URL, monta uma sessão provisória com esse token. Sem sessão nenhuma → manda pro login.
2. Chama `GET /web/session` (`validateWebSession`) pra confirmar que o token ainda é válido e já renovar (sliding expiration — token dura só `WEB_SESSION_TTL_MINUTES` no backend, hoje 30min) — é aqui também que a sessão provisória (do passo 1) ganha nome/e-mail/`subscriber`/`trialEndsAt` de verdade. Em paralelo, chama `GET /web/companies` (`getWebCompanies`) pra trazer as empresas onde o usuário é OWNER + `companiesLimit`. Falhou (sessão) → limpa a sessão e manda pro login **com o motivo do erro em `?sessionError=...`**, que o `index.html` lê e mostra no modal (não falha em silêncio).
3. Sessão válida → mescla nome/e-mail/token/`subscriber`/`trialEndsAt`/`companiesLimit`/`companies` atualizados na sessão salva e renderiza o painel normalmente.
4. Enquanto a página fica aberta, um `setInterval` (`SESSION_REFRESH_INTERVAL_MS`, 10min) repete o passo 2 (só sessão — `subscriber`/`trialEndsAt`; não rebusca empresas a cada tick) pra sessão não cair no meio do uso (mesmo tratamento de erro visível).

### Funções principais (`services/mock-data.js`)

- `APPS` — metadados de cada app (nome, cor, ícone).
- `ACCOUNT_TEMPLATE` — só o que ainda é fake (plano atual, faturas), anexado a qualquer usuário real que loga no FLOW. Sem `name`/`email`/empresas/status de assinante — isso tudo vem do backend (identidade do login, empresas de `GET /web/companies`, `subscriber`/`trialEndsAt` de `/web/login` e `/web/session`).
- `buildAccountSession(token, { userId, name, email })` — monta a sessão salva a partir de uma resposta real de login/sessão (`services/api.js`) + uma cópia própria do `ACCOUNT_TEMPLATE` (cópia, não referência — o painel edita `subscription` in-place ao trocar de plano). Empresas/`companiesLimit`/`subscriber`/`trialEndsAt` são mescladas por cima depois, não fazem parte deste template.
- `saveMockSession` / `getMockSession` / `clearMockSession` — wrappers de `localStorage` com try/catch (não quebram o fluxo se `localStorage` não estiver disponível).
- `PLANS.flow` — os 4 planos reais (Solo, Multi, Equipe, Personalizado).
- `FLOW_PRICING` / `calcularPrecoPersonalizado(empresas, usuarios)` / `formatBRL(valor)` — fórmula do plano Personalizado: base R$49,90 (1 empresa, 2 usuários) + R$25 por empresa extra + R$20 por usuário extra, sem os descontos de pacote que Multi/Equipe têm. Todos os planos são mensais.

### Funções principais (`services/api.js`)

- `webLogin(email, password)` → `POST /web/login`. Sem `device` nenhum — não é sessão de app (ver seção do backend). Resposta já inclui `subscriber`/`trialEndsAt` reais.
- `validateWebSession(token)` → `GET /web/session`. Renova o token (sliding expiration) e também retorna `subscriber`/`trialEndsAt` atualizados.
- `getWebCompanies(token)` → `GET /web/companies`. Empresas onde o usuário é OWNER (as únicas que contam contra o limite dele) + `companyLimit`.
- `updateWebUser(token, name)` → `PUT /web/update_user`. Persiste o nome de verdade no banco.
- `apiRequest()` (interno) já sabe extrair a mensagem de erro dos dois formatos que o backend usa (`{"detail": "..."}` na maioria das rotas, `{"message": "..."}` no login/sessão).

### Fluxo no `index.html`

Modal de login (`#login-modal-overlay`) com 2 passos: seleção de app → login (só FLOW; APP/STOCK pulam pro `delete.html`). Senha tem botão de "olhinho". Submit chama `webLogin()` de verdade — mostra "Entrando..." no botão enquanto aguarda e exibe a mensagem de erro do backend (`#login-error`) se falhar (credenciais erradas, conta inativa, etc.). Sucesso → `buildAccountSession()` + `saveMockSession()` + vai pro painel. Abaixo do formulário só um aviso — "Não tem uma conta? Acesse o Alembro FLOW e crie uma." — sem link. "Entrar como visitante" continua 100% mock, não passa pelo backend — manda direto pra `pages/conta.html?app=flow&guest=1`.

### Fluxo no `pages/conta.html`

- **Visitante** (`?guest=1`): mostra os 4 planos, só informativo (sem calculadora interativa — o Personalizado aparece como "Sob consulta"). Sem CTA de criar conta, só o mesmo aviso do login apontando pro app. Não bate no backend.
- **Logado, sem plano (trial)**: card de Assinatura mostra "Restam X dias do teste gratuito" + botão "Assinar agora", ou "Seu teste gratuito acabou" se `trialEndsAt` já passou. Ambos abrem o modal de planos. Estado real agora (`user.subscriber` vindo de `/web/login`/`/web/session`, não mais mock) — confirmado testando com conta real não-assinante.
- **Logado, com plano**: card de Assinatura normal (plano/valor/próxima cobrança/status) + botão "Alterar plano". O nome/valor/faturas em si continuam mock (`ACCOUNT_TEMPLATE`) — só o *se* o usuário é assinante é real; assinar/trocar plano no modal muda isso localmente (`user.subscriber = true`), não persiste no backend (não existe cobrança lá ainda).
- Modal "Alterar plano"/"Assinar" reaproveita a mesma função `planCardHTML()` usada na tela de visitante, em modo `'select'` (mostra botão "Selecionar" ou badge "Plano atual", só quando `user.subscriber` já é `true`). O card Personalizado tem inputs de texto sanitizados (só dígitos, sem o spinner feio do `input[type=number]`) que recalculam o preço ao vivo.
- **Card "Empresas" mostra uso, não detalhes, e é real.** Vem de `GET /web/companies` — só empresas onde o usuário é `OWNER` (as que ele é admin/usuário comum não contam pro limite dele nem aparecem aqui). Decisão deliberada de UI: nada de CNPJ, nome completo em destaque ou papel/role — só uma barra "X de Y empresas utilizadas" (`user.companiesLimit`, espelha `usuarios.limite_empresas`) e, por empresa, uma barra "X de Y usuários" (`company.usersUsed`/`company.usersLimit`). Não crie/edite empresa pelo site — isso também é só no app.
- "Dados da Conta" permite editar o Nome e agora persiste de verdade via `PUT /web/update_user` (antes só mudava local) — e-mail é somente leitura.

**Cuidado ao editar o card de Assinatura**: o botão "Alterar plano"/"Assinar agora" é recriado toda vez que `renderSubscription()` roda (troca de HTML via `innerHTML`). Por isso o listener de clique está no `#subscription-card` (delegado), não no botão direto.

## Backend real do FLOW (`AlembroFLOWbackend`, fora deste repositório)

Repositório separado em `C:\dev\Alembro\AlembroFLOW\AlembroFLOWbackend` (Rust/Axum + Postgres), já no ar em `https://api.alembro.com`. Esse repo tem seu próprio `CLAUDE.md`, focado só nas rotas `/web/*` usadas por este site — consulte lá para detalhes de implementação (SQL, structs, etc.); aqui é só o resumo do lado do consumidor.

### Rotas do site — conectadas (`/web/login`, `/web/session`, `/web/companies`, `/web/update_user`)

Endpoints próprios pro site, deliberadamente separados de `/login`/`/register_user`/`/update_user`/etc. (usados pelo app mobile):

- **Não usam `device`/tabela `dispositivos`** — por isso nunca contam contra `limite_dispositivos` do usuário. Era exatamente o problema que motivou criar rotas separadas em vez de adaptar as existentes.
- **JWT próprio**, assinado com `WEB_JWT_SECRET` (env var separada de `JWT_SECRET`, mesmo padrão de fallback inseguro em dev — **precisa estar configurada de verdade no `.env` de produção**). Vida curta: `auth::WEB_SESSION_TTL_MINUTES` (30min), renovado a cada `GET /web/session`.
- **Sem tabela nova no banco pra sessão.** A validade da sessão vive só num cache em memória (`AppState.web_sessions: RwLock<HashMap<String, WebSessionEntry>>`, chave = `wsid` gerado no login). Uma rotina em `main.rs` varre esse cache a cada 5min removendo entradas expiradas. Reiniciar o backend derruba todas as sessões web ativas (aceitável dado o TTL curto).
- O extrator `WebClaims` (`auth.rs`) checa assinatura do JWT **e** o cache — os dois precisam bater. `check_account_active()` (extraído de dentro de `login()`, sem alterar o `login()` original) é reaproveitado pra aplicar a mesma regra de conta inativa/excluída nos dois fluxos.
- `GET /web/companies` retorna só empresas onde o usuário é `OWNER` em `empresas_usuarios` (mesmo filtro que `register_company` já usava pra contar contra `limite_empresas` — empresas onde ele é admin/usuário comum não entram) + o `limite_empresas` do usuário.
- `PUT /web/update_user` persiste o nome de verdade (`UPDATE usuarios SET nome = ...`) — rota nova, separada do `/update_user` do app (que teria efeitos colaterais indesejados pra uma sessão web, ex: exigir campos de dispositivo).
- Login e sessão já retornam `subscriber`/`trialEndsAt` reais (`usuarios.assinante`/`usuarios.data_fim_teste`).

### O que ainda falta (não implementado)

- **Não existe nada de planos/cobrança no backend** — nem catálogo de planos, nem checkout, nem webhook, nem histórico de fatura. Gateway definido: AbacatePay (PIX), ainda não integrado. O card "Assinatura"/"Alterar plano" no site continua mock (nome do plano, valor, faturas) até essa parte existir — só o *status* de assinante (sim/não, trial) é real.
- **Site não deve contar como "sessão de app"**: resolvido pro login/sessão/empresas/update_user (nenhum usa `dispositivos`), mas se um dia o site precisar chamar outras rotas operacionais (`Claims` normal), o mesmo cuidado vale — não usar o `WebClaims`/token do site pra acessar rotas de app.
- **Registro de conta não é feito pelo site** (decisão de produto). No backend, criar empresa continua sendo `POST /register_company`, exige CNPJ/CPF — não tem nada a ver com as rotas do site.

## Convenções gerais

- Sem dependências novas, sem build step — mantenha HTML/CSS/JS puro.
- Textos, comentários e commits em português.
- Commits seguem Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- Ao adicionar algo "mock", deixe um comentário indicando onde entraria a chamada real via `services/api.js` (padrão já usado em vários lugares do código).
