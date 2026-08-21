# Alembro — Landing Page

Landing page estática (HTML/CSS/JS puro, sem build step, sem framework) hospedada no GitHub Pages com domínio próprio (`alembro.com`, ver `CNAME`). Publicada em https://murilo813.github.io/Alembro-LandingPage/.

## Estrutura

```
index.html, 404.html, CNAME, robots.txt, sitemap.xml   (raiz — exigido pelo GitHub Pages)
pages/
  privacy.html    política de privacidade
  delete.html     solicitação de exclusão de conta (Alembro APP e STOCK)
  thanks.html     página de agradecimento pós-contato
  conta.html      painel de conta mock do Alembro FLOW (login/visitante/planos)
assets/
  images/         favicon e .webp usados no index
  css/            styles.css — hoje não usado; todo CSS do site é inline em <style> dentro de cada HTML
services/
  api.js          client de exemplo (fetch wrapper), pronto pra plugar no formulário de contato
  mock-data.js    dados fake + lógica de preço do fluxo de conta do FLOW (ver seção abaixo)
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

## Sistema de login/conta do Alembro FLOW (mock)

STOCK e APP compartilham a mesma conta/login e já têm um fluxo real (login + exclusão de conta) em `pages/delete.html`, batendo num backend de verdade (`weberp.alembro.com`). Por isso, no modal de login (`index.html`), clicar em STOCK ou APP pula direto pra `pages/delete.html` — não passa pelo login mock.

**Alembro FLOW é o único com o fluxo mock completo** (login, visitante, painel de conta, planos), porque ainda não está conectado ao backend de contas de verdade (que já existe — ver seção "Backend real do FLOW" abaixo). Tudo isso é front-end puro, sem chamada real nenhuma — pronto pra trocar por chamadas de API de verdade depois.

**Não existe registro/criação de conta no site — decisão deliberada, não esquecimento.** O site é só gerenciamento de quem já é usuário do app; criar conta acontece dentro do Alembro FLOW (mobile/desktop). Já existiu uma tela de registro aqui (mock) e foi removida de propósito. Se pedirem pra "adicionar cadastro" de novo, confirme antes — pode ser um pedido genuíno de mudança de escopo, não a reintrodução do que já foi tirado.

### Por que os scripts não usam `import`/`export`

`services/mock-data.js` expõe tudo via `window.AlembroMockData` (IIFE clássica), **não** via ES modules. Isso é proposital: o site precisa continuar funcionando quando alguém abre `index.html` direto do disco (`file://`), e módulos ES são bloqueados por CORS nesse cenário. Scripts comuns (`<script src="...">`, sem `type="module"`) não têm essa restrição.

**Para testar mudanças, sirva os arquivos por HTTP** (`python -m http.server` na raiz do projeto) em vez de confiar só em abrir o arquivo direto — mais fácil de depurar e mais parecido com produção, embora `file://` também deva continuar funcionando.

### Sessão mock: localStorage + query string

A sessão fica em `localStorage` (`alembro-mock-session`), mas a página de destino (`pages/conta.html`) **prioriza a sessão salva sobre o parâmetro da URL** (`?app=flow`). O parâmetro da URL é só uma rede de segurança para quando `localStorage` não persiste entre páginas em `file://` (alguns navegadores isolam por arquivo). Já tivemos um bug aqui: se a prioridade for invertida (URL antes da sessão), toda conta recém-registrada ou com plano trocado volta a mostrar os dados genéricos de demo em vez dos dados reais da sessão. Ver `getMockSession() || (...)` em `pages/conta.html`.

### Funções principais (`services/mock-data.js`)

- `APPS` — metadados de cada app (nome, cor, ícone).
- `MOCK_USERS.flow` — usuário de demonstração (Rafael Andrade, plano Multi, `companiesLimit: 3`, 2 empresas em uso cada uma com `usersUsed`/`usersLimit`, faturas pagas). Usado por `mockLogin('flow')`.
- `mockLogin(appKey)` — login "bem-sucedido" sem validar nada, devolve o usuário de demo.
- `saveMockSession` / `getMockSession` / `clearMockSession` — wrappers de `localStorage` com try/catch (não quebram o fluxo se `localStorage` não estiver disponível).
- `PLANS.flow` — os 4 planos reais (Solo, Multi, Equipe, Personalizado).
- `FLOW_PRICING` / `calcularPrecoPersonalizado(empresas, usuarios)` / `formatBRL(valor)` — fórmula do plano Personalizado: base R$49,90 (1 empresa, 2 usuários) + R$25 por empresa extra + R$20 por usuário extra, sem os descontos de pacote que Multi/Equipe têm. Todos os planos são mensais.

### Fluxo no `index.html`

Modal de login (`#login-modal-overlay`) com 2 passos: seleção de app → login (só FLOW; APP/STOCK pulam pro `delete.html` como já explicado). Senha tem botão de "olhinho" (mostrar/ocultar). Abaixo do formulário só um aviso — "Não tem uma conta? Acesse o Alembro FLOW e crie uma." — sem link, porque criar conta é lá no app, não aqui. "Entrar como visitante" não cria sessão — manda direto pra `pages/conta.html?app=flow&guest=1`.

### Fluxo no `pages/conta.html`

- **Visitante** (`?guest=1`): mostra os 4 planos, só informativo (sem calculadora interativa — o Personalizado aparece como "Sob consulta"). Sem CTA de criar conta, só o mesmo aviso do login apontando pro app.
- **Logado, sem plano (trial)**: card de Assinatura mostra "Restam X dias do teste gratuito" + botão "Assinar agora", ou "Seu teste gratuito acabou" se `trialEndsAt` já passou. Ambos abrem o modal de planos. (Esse estado hoje só existe no código — nenhum `MOCK_USER` está nele, já que não tem mais registro no site. Pra testar, edite a sessão salva em `localStorage` na mão, tipo já fizemos ao validar essa tela.)
- **Logado, com plano**: card de Assinatura normal (plano/valor/próxima cobrança/status) + botão "Alterar plano".
- Modal "Alterar plano"/"Assinar" reaproveita a mesma função `planCardHTML()` usada na tela de visitante, em modo `'select'` (mostra botão "Selecionar" ou badge "Plano atual"). O card Personalizado tem inputs de texto sanitizados (só dígitos, sem o spinner feio do `input[type=number]`) que recalculam o preço ao vivo.
- **Card "Empresas" mostra uso, não detalhes.** Decisão deliberada: nada de CNPJ, nome completo de cada empresa em destaque ou papel/role — só uma barra "X de Y empresas utilizadas" (`user.companiesLimit`) e, por empresa, uma barra "X de Y usuários" (`company.usersUsed`/`company.usersLimit`). Não crie/edite empresa pelo site — isso também é só no app.
- "Dados da Conta" só permite editar o Nome — e-mail é somente leitura.

**Cuidado ao editar o card de Assinatura**: o botão "Alterar plano"/"Assinar agora" é recriado toda vez que `renderSubscription()` roda (troca de HTML via `innerHTML`). Por isso o listener de clique está no `#subscription-card` (delegado), não no botão direto — um listener preso no botão se perderia depois da primeira troca de plano.

## Backend real do FLOW (`AlembroFLOWbackend`, fora deste repositório)

Repositório separado em `C:\dev\Alembro\AlembroFLOW\AlembroFLOWbackend` (Rust/Axum + Postgres). Já está no ar em `https://api.alembro.com` (bate com `API_BASE_URL` em `services/api.js`). Login/registro/conta ainda **não estão conectados** — o site inteiro roda no mock. Principais pontos levantados numa análise (sem alterar nada lá):

- `POST /login` e `POST /register_user` exigem um campo `device` (o backend rastreia sessão por dispositivo, pensado pro app mobile). Web não tem "device id" nativo — a integração real vai precisar gerar um UUID e persistir em `localStorage` pra mandar como `device`.
- **Registro de conta não vai ser feito pelo site** (decisão do produto, não limitação técnica) — mas de qualquer forma, no backend real, criar uma empresa é uma chamada separada (`POST /register_company`) que exige CNPJ/CPF. `register_user` sozinho não cria empresa nenhuma.
- **Site não deve contar como "sessão de app"** — ainda em aberto como resolver no backend (talvez via o header `x-app-platform`, que o CORS já permite mas nada usa ainda). Não é algo pra decidir/implementar aqui no front.
- `empresas.assinante`/`empresas.data_fim_teste` são espelho de `usuarios.assinante`/`usuarios.data_fim_teste` (copiados pra facilitar consulta) — a fonte de verdade é o usuário, não a empresa.
- O login real já devolve `companies[]` com `usersLimit`/`active_users` por empresa e `companyLimit` do usuário — dá pra montar as barras de uso (ver seção acima) quase direto desses campos quando conectar de verdade.
- **Não existe nada de planos/cobrança no backend** — nem catálogo de planos, nem checkout, nem webhook, nem histórico de fatura. Isso é trabalho novo, ainda não começado. Gateway definido: AbacatePay (PIX). O card "Assinatura"/"Alterar plano" no mock é 100% inventado até essa parte existir.
- `JWT_SECRET` não está no `.env` local do backend (cai num valor padrão inseguro) — verificar se o `.env` de produção tem um valor de verdade antes de expor login pelo site.

## Convenções gerais

- Sem dependências novas, sem build step — mantenha HTML/CSS/JS puro.
- Textos, comentários e commits em português.
- Commits seguem Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- Ao adicionar algo "mock", deixe um comentário indicando onde entraria a chamada real via `services/api.js` (padrão já usado em vários lugares do código).
