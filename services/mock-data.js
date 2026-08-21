/**
 * services/mock-data.js
 *
 * Login e sessão do Alembro FLOW já são reais (ver services/api.js,
 * POST /web/login e GET /web/session). O que ainda é fake aqui é tudo que
 * depende de cobrança/assinatura, que o backend ainda não tem: plano
 * atual, uso de empresas/usuários e histórico de faturas. `buildAccountSession()`
 * é o ponto de junção — pega a identidade real (nome/e-mail/token, vindos
 * do login) e anexa esse pacote de dados fake por cima, no mesmo formato
 * que pages/conta.html já espera. Quando existir cobrança de verdade, a
 * ideia é trocar só o `ACCOUNT_TEMPLATE` por uma chamada real, sem mexer
 * no HTML/CSS do painel.
 *
 * Exposto como `window.AlembroMockData` (script comum, sem import/export)
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

  // Regras de preço do plano Personalizado do Alembro FLOW. Base = Solo (1
  // empresa, 2 usuários), e cada empresa/usuário extra soma um valor fixo —
  // sem os descontos de pacote que Multi e Equipe têm. Todos os planos são
  // mensais (sem opção anual).
  const FLOW_PRICING = {
    baseEmpresas: 1,
    baseUsuarios: 2,
    basePreco: 49.9,
    precoPorEmpresaExtra: 25,
    precoPorUsuarioExtra: 20,
  };

  function formatBRL(valor) {
    return "R$ " + valor.toFixed(2).replace(".", ",");
  }

  /**
   * Calcula o preço mensal do plano Personalizado: base (1 empresa, 2
   * usuários) + valor por empresa extra + valor por usuário extra. Não
   * aplica os descontos de pacote que Multi/Equipe têm — é a fórmula "crua".
   *
   * @param {number} empresas
   * @param {number} usuarios
   * @returns {number}
   */
  function calcularPrecoPersonalizado(empresas, usuarios) {
    const empresasExtras = Math.max(0, empresas - FLOW_PRICING.baseEmpresas);
    const usuariosExtras = Math.max(0, usuarios - FLOW_PRICING.baseUsuarios);
    return (
      FLOW_PRICING.basePreco +
      empresasExtras * FLOW_PRICING.precoPorEmpresaExtra +
      usuariosExtras * FLOW_PRICING.precoPorUsuarioExtra
    );
  }

  // Planos reais do Alembro FLOW, usados tanto na tela de visitante
  // (pages/conta.html com ?guest=1) quanto no modal "Alterar plano" de quem
  // já assina. Sem checkout real ainda — só o cálculo de preço, que já sai
  // certo pra quando plugar um gateway de pagamento de verdade.
  const PLANS = {
    flow: [
      {
        id: "solo",
        nome: "Solo",
        preco: FLOW_PRICING.basePreco,
        descricao: "1 empresa, 2 usuários (você + 1)",
        recursos: [
          "1 empresa",
          "2 usuários (você + 1)",
          "Cadastro de clientes e estoque",
          "Emissão de pedidos ilimitada",
        ],
      },
      {
        id: "multi",
        nome: "Multi",
        preco: 99.9,
        descricao: "Até 3 empresas, 2 usuários por empresa",
        recursos: [
          "Até 3 empresas",
          "2 usuários por empresa",
          "Gestão centralizada entre empresas",
          "Relatórios por empresa",
        ],
      },
      {
        id: "equipe",
        nome: "Equipe",
        preco: 99.9,
        descricao: "1 empresa, até 5 usuários",
        recursos: [
          "1 empresa",
          "Até 5 usuários",
          "Formas de pagamento e usuários ilimitados",
          "Relatórios gerenciais completos",
        ],
      },
      {
        id: "personalizado",
        nome: "Personalizado",
        preco: null,
        descricao: "Você escolhe a quantidade de empresas e usuários",
        recursos: [
          `Base: ${formatBRL(FLOW_PRICING.basePreco)} (1 empresa, 2 usuários)`,
          `+ ${formatBRL(FLOW_PRICING.precoPorEmpresaExtra)} por empresa adicional`,
          `+ ${formatBRL(FLOW_PRICING.precoPorUsuarioExtra)} por usuário adicional`,
          "Sem os descontos de pacote do Multi/Equipe",
        ],
      },
    ],
  };

  // Só o plano em si (nome/valor/faturas) ainda é fake — o backend não tem
  // cobrança ainda. Empresas/uso e o status de assinante/trial já vêm reais
  // (services/api.js — getWebCompanies, webLogin/validateWebSession).
  // Anexado por cima da identidade real (nome/e-mail) em buildAccountSession().
  const ACCOUNT_TEMPLATE = {
    subscription: {
      planoId: "multi",
      plano: "Multi",
      valor: "R$ 99,90/mês",
      proximaCobranca: "05/09/2026",
      status: "ativa",
    },
    invoices: [
      { id: "INV-1042", data: "05/08/2026", valor: "R$ 99,90", status: "Paga" },
      { id: "INV-1029", data: "05/07/2026", valor: "R$ 99,90", status: "Paga" },
      { id: "INV-1015", data: "05/06/2026", valor: "R$ 99,90", status: "Paga" },
      { id: "INV-1001", data: "05/05/2026", valor: "R$ 99,90", status: "Paga" },
    ],
  };

  const SESSION_KEY = "alembro-mock-session";

  /**
   * Monta a sessão salva localmente a partir de uma resposta real de
   * login/sessão (services/api.js) + o pacote de dados fake de assinatura.
   * Cada sessão recebe sua própria cópia do template (não uma referência
   * compartilhada), já que o painel edita `subscription` in-place ao
   * trocar de plano.
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
        ...JSON.parse(JSON.stringify(ACCOUNT_TEMPLATE)),
      },
    };
  }

  // localStorage pode não existir/ser acessível em alguns contextos (ex:
  // certas configurações de arquivo local aberto direto via file://), então
  // essas funções falham de forma silenciosa em vez de quebrar o fluxo de
  // login — a navegação entre index.html e pages/conta.html não depende
  // delas, só usa isso pra manter os dados editados durante a demo.
  function saveMockSession(session) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (err) {
      /* ambiente sem acesso a localStorage — segue sem persistir */
    }
  }

  function getMockSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function clearMockSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (err) {
      /* ambiente sem acesso a localStorage — nada a limpar */
    }
  }

  global.AlembroMockData = {
    APPS,
    PLANS,
    FLOW_PRICING,
    formatBRL,
    calcularPrecoPersonalizado,
    buildAccountSession,
    saveMockSession,
    getMockSession,
    clearMockSession,
  };
})(window);
