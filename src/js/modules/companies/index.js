let container=null, services=null, items=[], listeners=[];
export const moduleMeta = { id: "companies", label: "Empresas clientes" };
export async function mount(root, injected) {
  container=root; services=injected; container.className="module module--companies";
  container.innerHTML=`<div class="module-head"><div><p class="eyebrow">JOB CONNECT</p><h1>Empresas clientes</h1><p>Gestiona registros con operaciones seguras y estado local.</p></div><button class="btn btn--primary" data-action="new">+ Nuevo</button></div>
  <div class="module-toolbar"><input data-search type="search" placeholder="Buscar…" aria-label="Buscar"><span data-count></span></div>
  <form data-form class="entity-form" hidden><h2 data-form-title>Nuevo registro</h2><div class="form-grid"><label>Empresa<input name="title"  required></label>
<label>Descripción<input name="description"  required></label>
<label>Sector<input name="category"  required></label>
<label>Referencia<input name="price"  required></label></div><div class="form-actions"><button type="button" class="btn" data-action="cancel">Cancelar</button><button class="btn btn--primary" type="submit">Guardar</button></div></form>
  <div data-state class="module-state">Cargando…</div><div data-list class="entity-list"></div>`;
  const on=(event, selector, handler)=>{const fn=e=>{const target=e.target.closest(selector);if(target)handler(e,target)};container.addEventListener(event,fn);listeners.push(()=>container.removeEventListener(event,fn));};
  on("click","[data-action='new']",()=>openForm()); on("click","[data-action='cancel']",()=>closeForm());
  on("submit","[data-form]",submitForm); on("click","[data-edit]",(_,el)=>editItem(Number(el.dataset.edit))); on("click","[data-delete]",(_,el)=>deleteItem(Number(el.dataset.delete)));
  const search=container.querySelector("[data-search]"); const searchHandler=()=>renderList(search.value); search.addEventListener("input",searchHandler); listeners.push(()=>search.removeEventListener("input",searchHandler));
  try { services.feedback.loading("Cargando empresas clientes…"); const result=await services.api.get("/carts"); items=Array.isArray(result)?result:(result?.carts||[]); services.feedback.clear(); renderList(); }
  catch(error){ services.feedback.clear(); showState(error.message,"error"); }
}
function openForm(item=null) {
 const form=container.querySelector("[data-form]"); form.hidden=false; form.dataset.id=item?.id||"";
 container.querySelector("[data-form-title]").textContent=item?"Editar registro":"Nuevo registro";
 [('title', 'Empresa'), ('description', 'Descripción'), ('category', 'Sector'), ('price', 'Referencia')].forEach(([name])=>{const input=form.elements[name];if(input)input.value=item?.[name]??""});
 form.scrollIntoView({behavior:"smooth",block:"nearest"}); form.elements[[('title', 'Empresa'), ('description', 'Descripción'), ('category', 'Sector'), ('price', 'Referencia')][0][0]]?.focus();
}
function closeForm(){container.querySelector("[data-form]").hidden=true}
async function submitForm(e) {
 e.preventDefault(); const form=e.currentTarget; if(!form.reportValidity())return;
 const data={}; [('title', 'Empresa'), ('description', 'Descripción'), ('category', 'Sector'), ('price', 'Referencia')].forEach(([name])=>data[name]=form.elements[name].value);
 if([('title', 'Empresa'), ('description', 'Descripción'), ('category', 'Sector'), ('price', 'Referencia')].some(([name])=>name==="userId")) data.userId=Number(data.userId);
 if(data.completed!==undefined) data.completed=["true","on","1","sí","si"].includes(String(data.completed).toLowerCase());
 if(data.price!==undefined) data.price=Number(data.price)||0;
 const id=Number(form.dataset.id); const method=id?"put":"post";
 try { services.feedback.loading(id?"Actualizando…":"Creando…"); const result=await services.api[method]("/carts"+(id?"/"+id:""),data); if(id)items=items.map(x=>x.id===id?{...x,...result,...data}:x);else items=[{id:result?.id||Date.now(),...data,...result},...items]; services.feedback.success(id?"Registro actualizado.":"Registro creado."); closeForm();renderList(); }
 catch(error){ services.feedback.error(error.message)}
}
function editItem(id){const item=items.find(x=>x.id===id);if(item)openForm(item)}
async function deleteItem(id){if(!await services.feedback.confirmDelete("¿Eliminar este registro?"))return;try{ services.feedback.loading("Eliminando…");await services.api.remove("/carts/"+id);items=items.filter(x=>x.id!==id);services.feedback.success("Registro eliminado.");renderList()}catch(error){services.feedback.error(error.message)}}
function renderList(query="") {
 const list=container.querySelector("[data-list]"), state=container.querySelector("[data-state]"); state.hidden=true;
 const q=query.toLowerCase(); const filtered=items.filter(item=>JSON.stringify(item).toLowerCase().includes(q)); container.querySelector("[data-count]").textContent=`${filtered.length} registro(s)`;
 if(!filtered.length){state.hidden=false;state.textContent="No hay registros para mostrar.";list.innerHTML="";return}
 list.innerHTML=filtered.map(item=>card(item)).join("");
}
function card(item){const title=escapeHtml(String(item.title??"Registro")); const body=escapeHtml(String(item.description??item.body??""));return `<article class="entity-card"><div><h2>${title}</h2><p>${body}</p><small>ID: ${item.id??"local"}</small></div><div class="card-actions"><button class="btn" data-edit="${item.id}">Editar</button><button class="btn btn--danger" data-delete="${item.id}">Eliminar</button></div></article>`}
function showState(message,type="empty"){const s=container.querySelector("[data-state]");s.hidden=false;s.className=`module-state is-${type}`;s.textContent=message}
function escapeHtml(v){return v.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
export function unmount(){listeners.forEach(fn=>fn());listeners=[];container?.replaceChildren();container=null;services=null;items=[];}
