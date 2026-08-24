export function renderShell({ root, modules, onSelect, onLogout }) {
  root.innerHTML=`<div class="app-shell"><aside class="sidebar" aria-label="Navegación principal">
    <div class="brand"><span class="brand-mark">JC</span><span>JobConnect</span></div>
    <nav class="nav-list">${modules.map(m=>`<button class="nav-item" data-module="${m.id}">${m.label}</button>`).join("")}</nav>
    <button class="logout" data-logout>Cerrar sesión</button>
  </aside><div class="main-panel"><header class="topbar"><button class="menu-toggle" aria-label="Abrir menú">☰</button><div><span class="eyebrow">PLATAFORMA</span><strong>Gestión de talento</strong></div><div class="user-chip" data-user>Usuario</div></header><main id="module-content" tabindex="-1"></main></div></div>`;
  const contentContainer=root.querySelector("#module-content");
  root.querySelectorAll("[data-module]").forEach(btn=>btn.addEventListener("click",()=>onSelect(btn.dataset.module)));
  root.querySelector("[data-logout]").addEventListener("click",onLogout);
  root.querySelector(".menu-toggle").addEventListener("click",()=>root.querySelector(".sidebar").classList.toggle("is-open"));
  return { contentContainer };
}