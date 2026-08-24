/**
 * services/account.js
 *
 * Utilitários do site: metadados visuais dos apps (`APPS`), formatação de
 * moeda, o cálculo do plano Personalizado e os wrappers de sessão em
 * localStorage. Login/sessão/empresas/planos/assinatura/faturas em si são
 * todos reais e vêm de services/api.js — nada aqui é dado fake.
 *
 * Exposto como `window.AlembroAccount` (script comum, sem import/export)
 * pra funcionar também quando o site é aberto direto como arquivo local
 * (file://), onde módulos ES são bloqueados pelo navegador.
 */

(function (global) {
  const APPS = {
    flow: {
      key: "flow",
      name: "Alembro FLOW",
      shortName: "FLOW",
      description: "Gestão administrativa",
      colorHex: "#16A34A",
      cssVar: "var(--flow-green)",
      gradientVar: "var(--flow-green)",
      icon: "fa-bolt",
    },
    stock: {
      key: "stock",
      name: "Alembro STOCK",
      shortName: "STOCK",
      description: "Controle de estoque",
      colorHex: "#0056A3",
      cssVar: "#3399FF",
      gradientVar: "var(--stock-gradient)",
      icon: "fa-boxes-stacked",
    },
  };

  function formatBRL(value) {
    return "R$ " + value.toFixed(2).replace(".", ",");
  }

  /**
   * Calcula o preço mensal do plano Personalizado: preço base do plano
   * (empresas/usuários incluídos) + valor por empresa extra + valor por
   * usuário extra, cadastrados na tabela `planos` do backend (GET
   * /web/plans) — não aplica os descontos de pacote que Multi/Equipe têm,
   * é a fórmula "crua".
   *
   * `users` é **por empresa**, não um total dividido entre elas, então
   * o valor do usuário extra multiplica pelo número de empresas: cada
   * assento a mais custa o mesmo, esteja em que empresa estiver. Precisa
   * bater com `calculate_price_cents` no backend — quem decide o valor
   * cobrado é ele, aqui é só a prévia na tela.
   *
   * @param {{monthlyPrice: number, includedCompanies: number, includedUsers: number, extraCompanyPrice: number, extraUserPrice: number}} plan
   * @param {number} companies
   * @param {number} users usuários por empresa
   * @returns {number}
   */
  function calculateCustomPlanPrice(plan, companies, users) {
    const extraCompanies = Math.max(0, companies - plan.includedCompanies);
    const extraUsers = Math.max(0, users - plan.includedUsers);
    return (
      plan.monthlyPrice +
      extraCompanies * plan.extraCompanyPrice +
      extraUsers * plan.extraUserPrice * companies
    );
  }

  // Nome da chave mantido como estava (não "alembro-account-session") de
  // propósito: é só o rótulo interno do localStorage, ninguém olha esse
  // valor — renomear derrubaria a sessão de todo mundo já logado sem
  // nenhum ganho real.
  const SESSION_KEY = "alembro-mock-session";

  /**
   * Monta a sessão salva localmente a partir de uma resposta real de
   * login/sessão (services/api.js).
   *
   * Não anexa mais nenhum dado fake: plano/assinatura vêm de
   * `GET /web/subscription`, empresas de `GET /web/companies` e o status
   * de assinante do próprio login — tudo mesclado depois, em
   * pages/conta.html.
   *
   * @param {string} token
   * @param {{userId: number, name: string, email: string}} identity
   * @returns {{token: string, user: object}}
   */
  function buildAccountSession(token, identity) {
    return {
      token,
      user: {
        userId: identity.userId,
        name: identity.name,
        email: identity.email,
        appKey: "flow",
      },
    };
  }

  // localStorage pode não existir/ser acessível em alguns contextos (ex:
  // certas configurações de arquivo local aberto direto via file://), então
  // essas funções falham de forma silenciosa em vez de quebrar o fluxo de
  // login — a navegação entre index.html e pages/conta.html não depende
  // delas, só usa isso pra manter a sessão entre uma página e outra.
  function saveSession(session) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (err) {
      /* ambiente sem acesso a localStorage — segue sem persistir */
    }
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (err) {
      /* ambiente sem acesso a localStorage — nada a limpar */
    }
  }

  global.AlembroAccount = {
    APPS,
    formatBRL,
    calculateCustomPlanPrice,
    buildAccountSession,
    saveSession,
    getSession,
    clearSession,
  };
})(window);
