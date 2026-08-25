export const moduleMeta = Object.freeze({ id: "resumes", label: "Mis currículums", shortLabel: "CV" });

let cleanup = [];
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

export function mount(container, services) {
  const resumes = services.resumes;
  container.innerHTML = `<section class="module module--resumes"><header class="module-head"><div><p class="eyebrow">JOBCONNECT / CV</p><h1>Mis currículums</h1><p>Guarda diferentes versiones y elige la adecuada al postularte.</p></div><label class="btn btn--primary">＋ Subir currículums<input data-resume-files type="file" accept=".pdf,.doc,.docx" multiple hidden></label></header><div data-resume-list class="entity-list entity-list--grid"></div></section>`;
  const list = container.querySelector("[data-resume-list]");
  const input = container.querySelector("[data-resume-files]");
  const render = () => {
    const records = resumes.list();
    list.innerHTML = records.length ? records.map((item, index) => `<article class="entity-card"><div class="entity-card__identity"><span>CV</span><small>${String(index + 1).padStart(2, "0")}</small></div><div class="entity-card__content"><div class="entity-card__heading"><h2>${escapeHtml(item.name)}</h2><span class="entity-card__status">CURRÍCULUM</span></div><p>${Math.max(1, Math.round(item.size / 1024))} KB · Subido ${new Date(item.uploadedAt).toLocaleDateString("es")}</p></div><div class="card-actions"><button class="btn btn--compact btn--danger" data-remove-resume="${escapeHtml(item.id)}">Eliminar</button></div></article>`).join("") : `<div class="module-state is-empty"><strong>Aún no tienes currículums</strong><p>Sube uno o varios archivos PDF, DOC o DOCX para poder aplicar.</p></div>`;
  };
  const change = async () => { try { const added = await resumes.addFiles(input.files); render(); services.feedback.success(`${added.length} currículum${added.length === 1 ? "" : "s"} guardado${added.length === 1 ? "" : "s"}.`); input.value = ""; } catch (error) { services.feedback.error(error.message); } };
  const click = event => { const button = event.target.closest("[data-remove-resume]"); if (!button) return; resumes.remove(button.dataset.removeResume); render(); services.feedback.success("Currículum eliminado."); };
  input.addEventListener("change", change); list.addEventListener("click", click); cleanup = [() => input.removeEventListener("change", change), () => list.removeEventListener("click", click)]; render();
}

export function unmount() { cleanup.forEach(fn => fn()); cleanup = []; }
