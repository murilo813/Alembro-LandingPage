/**
 * services/api.js
 *
 * Client real pro backend do Alembro FLOW (AlembroFLOWbackend, Rust/Axum
 * em https://api.alembro.com). Login, sessão, empresas (uso real de
 * empresas/usuários) e edição de nome já são reais. O que ainda é mock é
 * só o plano em si (nome do plano, valor, faturas) — ver
 * services/mock-data.js — porque o backend ainda não tem cobrança.
 *
 * Exposto como `window.AlembroAPI` (script comum, sem import/export) pelo
 * mesmo motivo do mock-data.js: o site precisa continuar funcionando
 * quando aberto direto do disco (file://), onde módulos ES são bloqueados
 * pelo navegador.
 */

(function (global) {
  // const API_BASE_URL = "https://api.alembro.com";
  const API_BASE_URL = "http://localhost:5000";

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

  global.AlembroAPI = {
    sendContactLead,
    webLogin,
    validateWebSession,
    getWebCompanies,
    updateWebUser,
  };
})(window);
