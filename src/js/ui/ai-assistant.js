const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const SUGGESTIONS = { "job-seeker": ["Ayúdame a mejorar mi currículum", "¿Cómo me preparo para una entrevista?"], employer: ["Redacta una vacante inclusiva", "¿Cómo evaluar candidatos objetivamente?"], admin: ["Dame buenas prácticas de reclutamiento", "¿Cómo organizar un proceso de selección?"] };

export function createAiAssistant(root, { role = "job-seeker" } = {}) {
  const host = root?.querySelector?.(".app-shell") || root;
  if (!host) return () => {};
  const messages = [];
  const wrapper = document.createElement("div");
  const suggestions = SUGGESTIONS[role] || SUGGESTIONS["job-seeker"];
  wrapper.className = "ai-assistant";
  wrapper.innerHTML = `<button class="ai-assistant__launcher" type="button" data-ai-open aria-expanded="false" aria-controls="ai-assistant-panel"><span>✦</span> Asistente IA</button><aside id="ai-assistant-panel" class="ai-assistant__panel" aria-hidden="true"><header><div><small>IMPULSADO POR GEMINI</small><strong>Conecta</strong><p>Tu asistente de reclutamiento</p></div><button type="button" data-ai-close aria-label="Cerrar asistente">×</button></header><div class="ai-assistant__messages" data-ai-messages><div class="ai-message ai-message--model">Hola, soy Conecta. Puedo ayudarte con reclutamiento, vacantes y currículums.</div><div class="ai-suggestions">${suggestions.map(text => `<button type="button" data-ai-suggestion="${escapeHtml(text)}">${escapeHtml(text)}</button>`).join("")}</div></div><form data-ai-form><label class="sr-only" for="ai-question">Escribe tu consulta</label><textarea id="ai-question" data-ai-input rows="2" maxlength="4000" placeholder="Escribe tu consulta…" required></textarea><button class="btn btn--primary" type="submit">Enviar</button></form></aside>`;
  host.append(wrapper);
  const panel = wrapper.querySelector("[data-ai-close]").closest("aside");
  const launcher = wrapper.querySelector("[data-ai-open]");
  const form = wrapper.querySelector("[data-ai-form]");
  const input = wrapper.querySelector("[data-ai-input]");
  const list = wrapper.querySelector("[data-ai-messages]");
  const closePanel = () => { panel.classList.remove("is-open"); panel.setAttribute("aria-hidden", "true"); launcher.setAttribute("aria-expanded", "false"); };
  const openPanel = () => { panel.classList.add("is-open"); panel.setAttribute("aria-hidden", "false"); launcher.setAttribute("aria-expanded", "true"); input.focus(); };
  const append = (text, type) => { const node = document.createElement("div"); node.className = `ai-message ai-message--${type}`; node.textContent = text; list.append(node); list.scrollTop = list.scrollHeight; return node; };
  async function ask(text) {
    const question = text.trim(); if (!question) return;
    messages.push({ role: "user", text: question }); append(question, "user"); input.value = "";
    const pending = append("Pensando…", "pending"); form.setAttribute("aria-busy", "true");
    try {
      let language = "es"; try { language = JSON.parse(localStorage.getItem("jobconnect.accessibility") || "{}").language || "es"; } catch {}
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, language, messages }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo obtener respuesta.");
      pending.remove(); messages.push({ role: "model", text: data.answer }); append(data.answer, "model");
    } catch (error) { pending.textContent = error.message; pending.className = "ai-message ai-message--error"; }
    finally { form.setAttribute("aria-busy", "false"); input.focus(); }
  }
  launcher.addEventListener("click", openPanel); wrapper.querySelector("[data-ai-close]").addEventListener("click", closePanel);
  form.addEventListener("submit", event => { event.preventDefault(); ask(input.value); });
  wrapper.addEventListener("click", event => { const button = event.target.closest("[data-ai-suggestion]"); if (button) { openPanel(); ask(button.dataset.aiSuggestion); } });
  return () => wrapper.remove();
}
