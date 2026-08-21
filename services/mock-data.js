/**
 * services/mock-data.js
 *
 * Apesar do nome, **não sobrou nenhum dado fake aqui** — login, sessão,
 * empresas, planos e assinatura são todos reais (ver services/api.js). O
 * que restou são utilitários do site: metadados visuais dos apps
 * (`APPS`), formatação de moeda, o cálculo do plano Personalizado e os
 * wrappers de sessão em localStorage. O nome do arquivo (e a chave
 * `alembro-mock-session`) ficaram por compatibilidade.
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

  function formatBRL(valor) {
    return "R$ " + valor.toFixed(2).replace(".", ",");
  }

  /**
   * Calcula o preço mensal do plano Personalizado: preço base do plano
   * (empresas/usuários incluídos) + valor por empresa extra + valor por
   * usuário extra, cadastrados na tabela `planos` do backend (GET
   * /web/plans) — não aplica os descontos de pacote que Multi/Equipe têm,
   * é a fórmula "crua".
   *
   * @param {{precoMensal: number, empresasIncluidas: number, usuariosIncluidos: number, precoEmpresaExtra: number, precoUsuarioExtra: number}} plan
   * @param {number} empresas
   * @param {number} usuarios
   * @returns {number}
   */
  function calcularPrecoPersonalizado(plan, empresas, usuarios) {
    const empresasExtras = Math.max(0, empresas - plan.empresasIncluidas);
    const usuariosExtras = Math.max(0, usuarios - plan.usuariosIncluidos);
    return (
      plan.precoMensal +
      empresasExtras * plan.precoEmpresaExtra +
      usuariosExtras * plan.precoUsuarioExtra
    );
  }

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
    formatBRL,
    calcularPrecoPersonalizado,
    buildAccountSession,
    saveMockSession,
    getMockSession,
    clearMockSession,
  };
})(window);
