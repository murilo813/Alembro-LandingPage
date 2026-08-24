/**
 * services/api.js
 *
 * Client real pro backend do Alembro FLOW (AlembroFLOWbackend, Rust/Axum
 * em https://api.alembro.com). Login, sessão, empresas, planos, assinatura
 * e faturas — tudo aqui bate no backend de verdade, inclusive cobrança via
 * Asaas. Utilitários que não são chamada de API (formatação, cálculo de
 * preço, sessão em localStorage) ficam em services/account.js.
 *
 * Exposto como `window.AlembroAPI` (script comum, sem import/export) pelo
 * mesmo motivo do account.js: o site precisa continuar funcionando
 * quando aberto direto do disco (file://), onde módulos ES são bloqueados
 * pelo navegador.
 */

(function (global) {
  // const API_BASE_URL = "http://localhost:5000";
  const API_BASE_URL = "https://api.alembro.com:5005/flow";

  /**
   * Wrapper genérico de fetch: monta a URL, define headers padrão e trata
   * erro de resposta não-ok lançando uma exceção com a mensagem que o
   * backend mandou (ele usa dois formatos de erro — {"detail": "..."} na
   * maioria das rotas, {"status", "message", ...} no login/sessão — por
   * isso checa os dois).
   *
   * @param {string} path - caminho relativo, ex: "/web/login"
   * @param {object} [options] - mesmas opções do fetch (method, body, headers...)
   * @returns {Promise<any>} corpo da resposta já parseado como JSON
   */
  async function apiRequest(path, options = {}) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options.headers,
        },
      });
    } catch (err) {
      throw new Error("Erro de conexão. Tente novamente.");
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message =
        (data && (data.detail || data.message)) || response.statusText;
      throw new Error(message);
    }

    return data;
  }

  /**
   * Envia o lead do formulário de contato pro backend.
   * Mesma "forma" dos campos que hoje vão pro Formspree.
   *
   * @param {{nome: string, email: string, telefone: string, mensagem: string}} lead
   */
  function sendContactLead(lead) {
    return apiRequest("/leads", {
      method: "POST",
      body: JSON.stringify(lead),
    });
  }

  /**
   * Login do site institucional (gerenciamento de conta do Alembro FLOW).
   * Não manda `device` nenhum — essa sessão não é uma sessão de app, não
   * conta contra o limite de dispositivos do usuário (ver POST /web/login
   * no backend).
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{status: boolean, token: string, userId: number, name: string, email: string}>}
   */
  function webLogin(email, password) {
    return apiRequest("/web/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Revalida e renova a sessão do site (sliding expiration — o token do
   * site dura pouco, então isso deve ser chamado ao carregar a página de
   * conta e periodicamente enquanto ela estiver aberta).
   *
   * @param {string} token
   * @returns {Promise<{status: boolean, token: string, userId: number, name: string, email: string}>}
   */
  function validateWebSession(token) {
    return apiRequest("/web/session", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Empresas onde o usuário logado é OWNER (as únicas que contam contra o
   * limite de empresas dele — empresas onde ele é só admin/usuário não vêm
   * aqui) + o limite de empresas do usuário.
   *
   * @param {string} token
   * @returns {Promise<{companyLimit: number, companies: Array<{companyId: number, companyName: string, usersLimit: number, usersUsed: number}>}>}
   */
  function getWebCompanies(token) {
    return apiRequest("/web/companies", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Atualiza o nome do usuário de verdade (persiste no banco).
   *
   * @param {string} token
   * @param {string} name
   */
  function updateWebUser(token, name) {
    return apiRequest("/web/update_user", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
  }

  /**
   * Catálogo de planos do Alembro FLOW (tabela `planos` no backend), com o
   * valor por empresa/usuário extra do Personalizado. Sem autenticação —
   * é a mesma lista usada tanto no modo visitante quanto logado.
   *
   * @returns {Promise<Array<{id: number, slug: string, nome: string, descricao: string|null, precoMensal: number|null, empresasIncluidas: number, usuariosIncluidos: number, precoEmpresaExtra: number|null, precoUsuarioExtra: number|null, recursos: string[]}>>}
   */
  function getWebPlans() {
    return apiRequest("/web/plans", { method: "GET" });
  }

  /**
   * Assinatura atual do usuário, ou `null` se ele nunca assinou. Continua
   * vindo preenchida depois de cancelar, enquanto o período pago não
   * acabar (`ativaAte` no futuro, `status: "cancelada"`).
   *
   * @param {string} token
   * @returns {Promise<{planoSlug: string, planoNome: string, precoCentavos: number, status: string, empresasContratadas: number|null, usuariosContratados: number|null, ativaAte: string|null, canceladaEm: string|null}|null>}
   */
  function getWebSubscription(token) {
    return apiRequest("/web/subscription", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Faturas já pagas, da mais recente pra mais antiga (máx. 24). Só o que
   * o gateway confirmou — a próxima cobrança não vem daqui, o painel
   * projeta ela a partir de `ativaAte` de `getWebSubscription()`.
   *
   * @param {string} token
   * @returns {Promise<Array<{id: number, valorCentavos: number, pagoEm: string, formaPagamento: string|null, urlRecibo: string|null}>>}
   */
  function getWebInvoices(token) {
    return apiRequest("/web/invoices", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Inicia a assinatura de um plano. Devolve a URL do checkout da
   * AbacatePay, pra onde o usuário precisa ser mandado pra pagar.
   *
   * **Não manda valor nenhum de propósito** — o preço é calculado no
   * backend a partir da tabela de planos. `empresas`/`usuarios` só são
   * usados quando o plano é o Personalizado.
   *
   * @param {string} token
   * @param {string} planSlug
   * @param {{empresas?: number, usuarios?: number}} [extras]
   * @returns {Promise<{checkoutUrl: string}>}
   */
  function subscribeToPlan(token, planSlug, extras = {}) {
    return apiRequest("/web/subscribe", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ planSlug, ...extras }),
    });
  }

  /**
   * Cancela a assinatura. O acesso continua até o fim do período já pago
   * — o backend não corta na hora.
   *
   * @param {string} token
   */
  function cancelWebSubscription(token) {
    return apiRequest("/web/cancel_subscription", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  global.AlembroAPI = {
    sendContactLead,
    webLogin,
    validateWebSession,
    getWebCompanies,
    updateWebUser,
    getWebPlans,
    getWebSubscription,
    getWebInvoices,
    subscribeToPlan,
    cancelWebSubscription,
  };
})(window);
