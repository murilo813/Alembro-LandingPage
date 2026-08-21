/**
 * services/api.js
 *
 * Client de exemplo para conversar com o backend da Alembro quando ele existir.
 * Hoje o formulário de contato (index.html) ainda envia direto pro Formspree.
 * Quando o backend estiver pronto, é só trocar a chamada ao Formspree por
 * `sendContactLead(...)` (ver exemplo de uso no fim do arquivo).
 */

// Troque pela URL real da API quando o backend for pro ar
// (ex: "https://api.alembro.com" em produção).
const API_BASE_URL = "https://api.alembro.com";

/**
 * Wrapper genérico de fetch: monta a URL, define headers padrão
 * e já trata erro de resposta não-ok lançando uma exceção com o status.
 *
 * @param {string} path - caminho relativo, ex: "/leads"
 * @param {object} [options] - mesmas opções do fetch (method, body, headers...)
 * @returns {Promise<any>} corpo da resposta já parseado como JSON
 */
async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Erro ${response.status}: ${message}`);
  }

  // Algumas respostas (ex: 204 No Content) não têm corpo
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Envia o lead do formulário de contato pro backend.
 * Mesma "forma" dos campos que hoje vão pro Formspree.
 *
 * @param {{nome: string, email: string, telefone: string, mensagem: string}} lead
 */
export function sendContactLead(lead) {
  return apiRequest("/leads", {
    method: "POST",
    body: JSON.stringify(lead),
  });
}

/*
 * Exemplo de como plugar isso no lugar do Formspree em index.html:
 *
 *   import { sendContactLead } from './services/api.js';
 *
 *   form.onsubmit = async (e) => {
 *     e.preventDefault();
 *     const formData = new FormData(form);
 *     try {
 *       await sendContactLead({
 *         nome: formData.get('nome'),
 *         email: formData.get('_replyto'),
 *         telefone: formData.get('telefone'),
 *         mensagem: formData.get('mensagem'),
 *       });
 *       window.location.href = 'pages/thanks.html';
 *     } catch (err) {
 *       alert('Ops! Tivemos um problema de conexão. Tente novamente.');
 *     }
 *   };
 *
 * Pra usar import/export em index.html, adicione type="module" na tag <script>.
 */
