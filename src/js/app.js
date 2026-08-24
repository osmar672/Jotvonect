import { requireAuth, getCurrentUser, logout, getToken } from "./auth/auth-service.js";
import { createApiClient } from "./core/api-client.js";
import { createFeedbackService } from "./core/feedback-service.js";
import { renderShell } from "./ui/shell.js";
import * as candidates from "./modules/candidates/index.js";
import * as vacancies from "./modules/vacancies/index.js";
import * as companies from "./modules/companies/index.js";
import * as applications from "./modules/applications/index.js";
import * as interviews from "./modules/interviews/index.js";
import * as tasks from "./modules/tasks/index.js";

if (requireAuth()) {
  const modules=[candidates,vacancies,companies,applications,interviews,tasks];
  const api=createApiClient({getToken});
  const feedback=createFeedbackService();
  const services={api,feedback,auth:{getToken, isAuthenticated:()=>true, logout}};
  const root=document.querySelector("#app");
  let current=null;
  const {contentContainer}=renderShell({
    root, modules,
    onSelect: async id => {
      const next=modules.find(m=>m.moduleMeta.id===id); if(!next)return;
      try { current?.unmount(); current=next; await next.mount(contentContainer,services); contentContainer.focus(); root.querySelectorAll("[data-module]").forEach(b=>b.classList.toggle("is-active",b.dataset.module===id)); }
      catch(error){feedback.error(error.message||"No se pudo cargar el módulo.");}
    },
    onLogout:()=>{logout();window.location.replace("login.html");}
  });
  const user=getCurrentUser(); root.querySelector("[data-user]").textContent=`${user?.firstName||user?.username||"Usuario"} ${user?.lastName||""}`.trim();
  root.querySelector("[data-module]")?.click();
}