export const moduleMeta = Object.freeze({ id: "dashboard", label: "Dashboard general", shortLabel: "DB", description: "Indicadores generales de reclutamiento para administración." });

export async function mount(container, services) {
  if (services.role !== "admin") throw new Error("Este dashboard es exclusivo para administradores.");
  const sources = [{ key: "candidates", path: "/users", list: "users", label: "Candidatos" }, { key: "vacancies", path: "/products", list: "products", label: "Vacantes" }, { key: "companies", path: "/carts", list: "carts", label: "Empresas" }, { key: "applications", path: "/posts", list: "posts", label: "Postulaciones" }];
  container.innerHTML = `<section class="module admin-dashboard"><header class="module-head"><div><p class="eyebrow">ADMINISTRACIÓN / ANALÍTICA</p><h1>Dashboard general</h1><p>Vista consolidada del ecosistema de reclutamiento.</p></div></header><div class="dashboard-loading">Calculando indicadores…</div></section>`;
  const results = await Promise.all(sources.map(async source => { const data = await services.api.get(source.path); const records = Array.isArray(data) ? data : data?.[source.list] || []; return { ...source, total: Number(data?.total ?? records.length), records }; }));
  const max = Math.max(...results.map(item => item.total), 1);
  const applications = results.find(item => item.key === "applications")?.total || 0;
  const vacancies = results.find(item => item.key === "vacancies")?.total || 1;
  const conversion = Math.min(100, Math.round(applications / vacancies * 10));
  container.querySelector(".admin-dashboard").innerHTML = `<header class="module-head"><div><p class="eyebrow">ADMINISTRACIÓN / ANALÍTICA</p><h1>Dashboard general</h1><p>Vista consolidada del ecosistema de reclutamiento.</p></div></header><div class="dashboard-kpis">${results.map(item => `<article><span>${item.label}</span><strong>${item.total}</strong><small>registros disponibles</small></article>`).join("")}</div><div class="dashboard-grid"><figure><figcaption>Volumen general por módulo</figcaption><div class="dashboard-bars" role="img" aria-label="${results.map(item => `${item.label}: ${item.total}`).join(", ")}">${results.map(item => `<div><span>${item.label}</span><i style="--bar:${item.total / max * 100}%"></i><strong>${item.total}</strong></div>`).join("")}</div></figure><figure><figcaption>Actividad de postulaciones</figcaption><div class="dashboard-donut" style="--value:${conversion * 3.6}deg" role="img" aria-label="Índice relativo de actividad ${conversion} por ciento"><span><strong>${conversion}%</strong><small>actividad relativa</small></span></div></figure></div>`;
}
export function unmount() {}
