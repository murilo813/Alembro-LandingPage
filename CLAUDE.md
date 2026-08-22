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

A sessão (`{ token, user }`) fica em `localStorage` (`alembro-mock-session` — nome ficou desatualizado mas é o que tem; hoje `user` é 100% dado real vindo do backend).

**Achado real (não hipótese) rodando em Firefox com `file://`**: `index.html` e `pages/conta.html` não enxergam o mesmo `localStorage` — o Firefox isola storage por arquivo em `file://`, diferente de Chrome. Sem tratamento pra isso, o login funcionava (200) e a página até navegava pra `pages/conta.html`, mas lá dentro `getMockSession()` voltava `null` e ela batia em silêncio de volta pro `index.html` — sem erro, sem chamar `/web/session`, dando a impressão de "não faz nada". **Solução**: `index.html` manda o token de sessão também pela URL (`pages/conta.html?app=flow&token=...`) ao navegar depois do login — não é "reconstruir" um JWT a partir da URL (isso de fato não dá), é só levar adiante o mesmo token que o login já gerou. `pages/conta.html` usa esse `token` da URL como fallback quando `getMockSession()` não acha nada, tira o token da URL imediatamente (`history.replaceState`, não deixa JWT parado na barra de endereço) e valida ele contra `/web/session` do mesmo jeito. **Se mexer nesse fluxo de novo, teste em file:// no Firefox de propósito** — é o cenário que expôs isso; testar só via `http://127.0.0.1` (onde storage não é isolado) não pega esse tipo de bug.

Fluxo em `pages/conta.html` (fora do modo visitante):

1. Lê a sessão salva (`localStorage`); se não achar e tiver `?token=` na URL, monta uma sessão provisória com esse token. Sem sessão nenhuma → manda pro login.
2. Chama `GET /web/session` (`validateWebSession`) pra confirmar que o token ainda é válido e já renovar (sliding expiration — token dura só `WEB_SESSION_TTL_MINUTES` no backend, hoje 30min) — é aqui também que a sessão provisória (do passo 1) ganha nome/e-mail/`subscriber`/`trialEndsAt` de verdade. Depois chama `GET /web/companies` (empresas onde é OWNER + `companiesLimit`) e `GET /web/subscription` (assinatura atual). Falhou (sessão) → limpa a sessão e manda pro login **com o motivo do erro em `?sessionError=...`**, que o `index.html` lê e mostra no modal (não falha em silêncio).
3. Sessão válida → mescla nome/e-mail/token/`subscriber`/`trialEndsAt`/`companiesLimit`/`companies`/`subscription` atualizados na sessão salva e renderiza o painel normalmente.
4. Enquanto a página fica aberta, um `setInterval` (`SESSION_REFRESH_INTERVAL_MS`, 10min) repete o passo 2 (só sessão; não rebusca empresas a cada tick) pra sessão não cair no meio do uso (mesmo tratamento de erro visível). **Só rebusca a assinatura quando `subscriber` muda de valor** — cobre renovação/expiração/cancelamento acontecendo com a página aberta, sem bater no backend à toa a cada ciclo.

### Funções principais (`services/mock-data.js`)

**Apesar do nome, não sobrou nenhum dado fake neste arquivo** — login, sessão, empresas, planos e assinatura são todos reais. O nome do arquivo (e a chave `alembro-mock-session` no `localStorage`) ficaram por compatibilidade; o que resta aqui são utilitários.

- `APPS` — metadados de cada app (nome, cor, ícone).
- `buildAccountSession(token, { userId, name, email })` — monta a sessão salva a partir de uma resposta real de login/sessão (`services/api.js`). Não anexa mais nada: empresas, `companiesLimit`, `subscriber`/`trialEndsAt` e `subscription` são mesclados depois, em `pages/conta.html`, todos vindos do backend.
- `saveMockSession` / `getMockSession` / `clearMockSession` — wrappers de `localStorage` com try/catch (não quebram o fluxo se `localStorage` não estiver disponível).
- `calcularPrecoPersonalizado(plan, empresas, usuarios)` / `formatBRL(valor)` — fórmula do plano Personalizado: preço base do `plan` (empresas/usuários incluídos, vindos de `GET /web/plans`) + valor por empresa extra + valor por usuário extra, sem os descontos de pacote que Multi/Equipe têm. Todos os planos são mensais. Antes recebia só `(empresas, usuarios)` e lia uma constante local (`FLOW_PRICING`); agora recebe o objeto do plano porque os valores vêm do banco (`services/api.js`, `getWebPlans()`), não são mais chumbados aqui.

### Funções principais (`services/api.js`)

- `webLogin(email, password)` → `POST /web/login`. Sem `device` nenhum — não é sessão de app (ver seção do backend). Resposta já inclui `subscriber`/`trialEndsAt` reais.
- `validateWebSession(token)` → `GET /web/session`. Renova o token (sliding expiration) e também retorna `subscriber`/`trialEndsAt` atualizados.
- `getWebCompanies(token)` → `GET /web/companies`. Empresas onde o usuário é OWNER (as únicas que contam contra o limite dele) + `companyLimit`.
- `updateWebUser(token, name)` → `PUT /web/update_user`. Persiste o nome de verdade no banco.
- `getWebPlans()` → `GET /web/plans`. Sem autenticação — catálogo de planos (tabela `planos` no backend), cada item com `slug`, `nome`, `descricao`, `precoMensal` (base, no caso do Personalizado), `empresasIncluidas`, `usuariosIncluidos`, `precoEmpresaExtra`/`precoUsuarioExtra` (só preenchidos no Personalizado) e `recursos`. Chamado tanto no modo visitante quanto no modal "Alterar plano" (`pages/conta.html`, `loadFlowPlans()`, cacheado em `flowPlans` pra não rebuscar toda vez que o modal abre).
- `getWebSubscription(token)` → `GET /web/subscription`. Assinatura atual ou `null`. Continua vindo preenchida depois de cancelar, enquanto `ativaAte` estiver no futuro.
- `subscribeToPlan(token, planSlug, { empresas, usuarios })` → `POST /web/subscribe`. Devolve `{ checkoutUrl }` pra redirecionar o usuário. **Não manda valor nenhum** — ver abaixo.
- `cancelWebSubscription(token)` → `POST /web/cancel_subscription`.
- `apiRequest()` (interno) já sabe extrair a mensagem de erro dos dois formatos que o backend usa (`{"detail": "..."}` na maioria das rotas, `{"message": "..."}` no login/sessão).

### Assinatura: o front nunca decide preço nem libera acesso

Duas regras que valem pra qualquer mexida nessa área:

1. **O front nunca manda valor em reais.** `subscribeToPlan()` envia só a intenção (`planSlug` + quantidades no Personalizado); o backend recalcula o preço a partir da tabela `planos`. O cálculo que existe aqui (`calcularPrecoPersonalizado`) é **só pra exibir** o preço ao vivo na calculadora — não é a fonte de verdade de nada.
2. **O acesso só é liberado pelo backend, via webhook do gateway.** A volta do checkout (`?assinatura=processando`) é apenas uma dica de UI: qualquer um pode digitar essa URL. O painel entra em "Confirmando seu pagamento..." e fica revalidando `GET /web/session` (`aguardarConfirmacao()`, 3s, teto de 2min) até `subscriber` virar `true` de verdade. Nunca marque `user.subscriber = true` no cliente — foi exatamente o que a versão mock fazia e que precisou sair.

### Fluxo no `index.html`

Modal de login (`#login-modal-overlay`) com 2 passos: seleção de app → login (só FLOW; APP/STOCK pulam pro `delete.html`). Senha tem botão de "olhinho". Submit chama `webLogin()` de verdade — mostra "Entrando..." no botão enquanto aguarda e exibe a mensagem de erro do backend (`#login-error`) se falhar (credenciais erradas, conta inativa, etc.). Sucesso → `buildAccountSession()` + `saveMockSession()` + vai pro painel. Abaixo do formulário só um aviso — "Não tem uma conta? Acesse o Alembro FLOW e crie uma." — sem link. "Entrar como visitante" continua 100% mock, não passa pelo backend — manda direto pra `pages/conta.html?app=flow&guest=1`.

### Fluxo no `pages/conta.html`

- **Visitante** (`?guest=1`): mostra os planos, só informativo (sem calculadora interativa — o Personalizado aparece como "Sob consulta"). Sem CTA de criar conta, só o mesmo aviso do login apontando pro app. Não faz login nenhum, mas **bate em `GET /web/plans`** pra listar os planos (única chamada ao backend nesse modo — é só leitura pública, sem autenticação).
- **Logado, sem plano (trial)**: card de Assinatura mostra "Restam X dias do teste gratuito" + botão "Assinar agora", ou "Seu teste gratuito acabou" se `trialEndsAt` já passou. Ambos abrem o modal de planos. Estado real (`user.subscriber` vindo de `/web/login`/`/web/session`).
- **Logado, com plano ativo**: card mostra plano/valor/próxima cobrança/status vindos de `GET /web/subscription` + "Alterar plano" e "Cancelar assinatura".
- **Logado, cancelado dentro do período pago**: status "Cancelada", a linha de data vira "Acesso até", e o botão vira "Assinar novamente" (sem botão de cancelar). O modal não marca nenhum plano como "Plano atual" nesse estado, senão o plano que ele acabou de cancelar ficaria travado.
- **Voltando do checkout** (`?assinatura=processando`): card mostra "Confirmando seu pagamento..." e faz polling até o webhook confirmar. Ver a seção "Assinatura" acima — essa URL não prova pagamento nenhum.
- **Faturas**: o backend não tem histórico de fatura, então a lista mostra "Nenhuma fatura ainda" fixo.
- Modal "Alterar plano"/"Assinar" reaproveita a mesma função `planCardHTML()` usada na tela de visitante, em modo `'select'` (mostra botão "Selecionar" ou badge "Plano atual", só quando `user.subscriber` já é `true`). O card Personalizado tem inputs de texto sanitizados (só dígitos, sem o spinner feio do `input[type=number]`) que recalculam o preço ao vivo.
- **Card "Empresas" mostra uso, não detalhes, e é real.** Vem de `GET /web/companies` — só empresas onde o usuário é `OWNER` (as que ele é admin/usuário comum não contam pro limite dele nem aparecem aqui). Decisão deliberada de UI: nada de CNPJ, nome completo em destaque ou papel/role — só uma barra "X de Y empresas utilizadas" (`user.companiesLimit`, espelha `usuarios.limite_empresas`) e, por empresa, uma barra "X de Y usuários" (`company.usersUsed`/`company.usersLimit`). Não crie/edite empresa pelo site — isso também é só no app.
- "Dados da Conta" permite editar o Nome e agora persiste de verdade via `PUT /web/update_user` (antes só mudava local) — e-mail é somente leitura.

**Cuidado ao editar o card de Assinatura**: o botão "Alterar plano"/"Assinar agora" é recriado toda vez que `renderSubscription()` roda (troca de HTML via `innerHTML`). Por isso o listener de clique está no `#subscription-card` (delegado), não no botão direto.

## Backend real do FLOW (`AlembroFLOWbackend`, fora deste repositório)

Repositório separado em `C:\dev\Alembro\AlembroFLOW\AlembroFLOWbackend` (Rust/Axum + Postgres), já no ar em `https://api.alembro.com`. Esse repo tem seu próprio `CLAUDE.md`, focado só nas rotas `/web/*` usadas por este site — consulte lá para detalhes de implementação (SQL, structs, etc.); aqui é só o resumo do lado do consumidor.

### Rotas do site — conectadas (`/web/login`, `/web/session`, `/web/companies`, `/web/update_user`, `/web/plans`, `/web/subscribe`, `/web/subscription`, `/web/cancel_subscription`)

Endpoints próprios pro site, deliberadamente separados de `/login`/`/register_user`/`/update_user`/etc. (usados pelo app mobile):

- **Não usam `device`/tabela `dispositivos`** — por isso nunca contam contra `limite_dispositivos` do usuário. Era exatamente o problema que motivou criar rotas separadas em vez de adaptar as existentes.
- **JWT próprio**, assinado com `WEB_JWT_SECRET` (env var separada de `JWT_SECRET`, mesmo padrão de fallback inseguro em dev — **precisa estar configurada de verdade no `.env` de produção**). Vida curta: `auth::WEB_SESSION_TTL_MINUTES` (30min), renovado a cada `GET /web/session`.
- **Sem tabela nova no banco pra sessão.** A validade da sessão vive só num cache em memória (`AppState.web_sessions: RwLock<HashMap<String, WebSessionEntry>>`, chave = `wsid` gerado no login). Uma rotina em `main.rs` varre esse cache a cada 5min removendo entradas expiradas. Reiniciar o backend derruba todas as sessões web ativas (aceitável dado o TTL curto).
- O extrator `WebClaims` (`auth.rs`) checa assinatura do JWT **e** o cache — os dois precisam bater. `check_account_active()` (extraído de dentro de `login()`, sem alterar o `login()` original) é reaproveitado pra aplicar a mesma regra de conta inativa/excluída nos dois fluxos.
- `GET /web/companies` retorna só empresas onde o usuário é `OWNER` em `empresas_usuarios` (mesmo filtro que `register_company` já usava pra contar contra `limite_empresas` — empresas onde ele é admin/usuário comum não entram) + o `limite_empresas` do usuário.
- `PUT /web/update_user` persiste o nome de verdade (`UPDATE usuarios SET nome = ...`) — rota nova, separada do `/update_user` do app (que teria efeitos colaterais indesejados pra uma sessão web, ex: exigir campos de dispositivo).
- Login e sessão já retornam `subscriber`/`trialEndsAt` reais (`usuarios.assinante`/`usuarios.data_fim_teste`).
- `GET /web/plans` (sem autenticação, pública) lista o catálogo de planos da tabela `planos` (`ativo = true`, ordenado por `ordem_exibicao`). Ver `WebPlanResponse`/`get_web_plans` em `routes/login.rs`.

### Tabelas de plano e assinatura

Criadas pelos arquivos em `sql/` no backend (repo não tem ferramenta de migrations — schema é aplicado rodando SQL manualmente contra o banco, esses arquivos são só o registro do que foi rodado). Detalhes de implementação estão no `CLAUDE.md` de lá; o resumo do que importa pro site:

- `planos`: `slug` (chave usada pelo front, ex. `'personalizado'` — não confundir com o `id` numérico, que a UI não usa), `nome`, `descricao`, `preco_mensal` (no Personalizado é a *base* do cálculo, não "sob consulta"), `empresas_incluidas`/`usuarios_incluidos`, `preco_empresa_extra`/`preco_usuario_extra` (só no Personalizado), `recursos` (`TEXT[]`, bullets fixos — os bullets calculados do Personalizado, tipo "+ R$25 por empresa adicional", são montados no front a partir dos preços, não ficam salvos como texto), `ativo`, `ordem_exibicao`.
- `assinaturas` guarda o estado real; `usuarios` ganhou `id_plano`, `plano_empresas_contratadas`/`plano_usuarios_contratados`, `plano_atualizado_em` e `assinatura_ate`.
- Deliberadamente **não** existe tabela de histórico de plano — `assinaturas` acumula as tentativas, mas não há relatório de trocas. Se precisar, é coisa nova.

### O que ainda falta (não implementado)

- **Histórico de faturas**: sem rota no backend; o card mostra "Nenhuma fatura ainda" fixo.
- **Nenhum pagamento real foi feito ainda.** A criação de checkout já foi exercitada contra o sandbox da Asaas de verdade, e o webhook foi testado com payloads forjados (autenticação, idempotência, ativação, renovação), mas ninguém passou um cartão de teste ponta a ponta. Ver a seção correspondente no `CLAUDE.md` do backend pro que desconfiar no primeiro teste.
- **O gateway era AbacatePay e foi trocado por Asaas** (22/08/2026): eles descontinuaram cartão pra contas novas e desativaram o PIX Automático, tornando cobrança recorrente impossível por lá. Do lado do site **nada mudou** — as rotas `/web/subscribe`, `/web/subscription` e `/web/cancel_subscription` têm o mesmo contrato, e `services/api.js` não precisou de uma linha de alteração. A troca ficou toda contida no backend, que é o objetivo de o front nunca falar com o gateway direto.
- **Site não deve contar como "sessão de app"**: resolvido pro login/sessão/empresas/update_user (nenhum usa `dispositivos`), mas se um dia o site precisar chamar outras rotas operacionais (`Claims` normal), o mesmo cuidado vale — não usar o `WebClaims`/token do site pra acessar rotas de app.
- **Registro de conta não é feito pelo site** (decisão de produto). No backend, criar empresa continua sendo `POST /register_company`, exige CNPJ/CPF — não tem nada a ver com as rotas do site.

## Convenções gerais

- Sem dependências novas, sem build step — mantenha HTML/CSS/JS puro.
- Textos, comentários e commits em português.
- Commits seguem Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- Ao adicionar algo "mock", deixe um comentário indicando onde entraria a chamada real via `services/api.js` (padrão já usado em vários lugares do código).
