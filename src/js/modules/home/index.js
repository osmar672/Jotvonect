import { createLayout } from "../../../../node_modules/animejs/dist/modules/index.js";

export const moduleMeta = Object.freeze({
  id: "home",
  label: "Inicio",
  shortLabel: "IN",
  description: "Conoce JobConnect, sus estándares y la propuesta de valor."
});

const standards = Object.freeze([
  {
    number: "01",
    category: "RENDIMIENTO",
    tone: "lime",
    title: "Eficiencia",
    text: "Carga progresiva, animaciones aisladas y solicitudes HTTP controladas para mantener una experiencia ágil.",
    points: ["Carga progresiva", "Interacciones fluidas", "Solicitudes controladas"]
  },
  {
    number: "02",
    category: "ARQUITECTURA",
    tone: "paper",
    title: "Modularidad",
    text: "Cada dominio mantiene una responsabilidad clara y comparte servicios estables, evitando duplicación y dependencias innecesarias.",
    points: ["Responsabilidades claras", "Componentes reutilizables", "Crecimiento ordenado"]
  },
  {
    number: "03",
    category: "CALIDAD",
    tone: "ink",
    title: "Buenas prácticas",
    text: "HTML semántico, CSS responsivo, módulos ES, validaciones y manejo consistente de errores.",
    points: ["Semántica web", "Validación consistente", "Errores controlados"]
  },
  {
    number: "04",
    category: "MANTENIBILIDAD",
    tone: "sky",
    title: "Código claro",
    text: "Nombres descriptivos, responsabilidades pequeñas y contratos visibles para facilitar mantenimiento y trabajo en equipo.",
    points: ["Nombres descriptivos", "Funciones enfocadas", "Contratos visibles"]
  },
  {
    number: "05",
    category: "INCLUSIÓN",
    tone: "pink",
    title: "Accesibilidad",
    text: "Navegación por teclado, foco visible, estados ARIA y respeto por la preferencia de movimiento reducido.",
    points: ["Control por teclado", "Foco perceptible", "Movimiento responsable"]
  },
  {
    number: "06",
    category: "MEJORA CONTINUA",
    tone: "violet",
    title: "Resolución de problemas",
    text: "Diagnóstico, normalización de fallos y pruebas automatizadas para convertir incidencias en mejoras verificables.",
    points: ["Diagnóstico estructurado", "Pruebas reproducibles", "Resultados verificables"]
  }
]);

const processSteps = Object.freeze([
  { number: "01", title: "Entender", text: "Analizamos la necesidad, el usuario y el resultado esperado.", signal: "ESCUCHAR", details: ["Entrevistar a las personas involucradas", "Identificar barreras y necesidades reales", "Definir objetivos y criterios de éxito"], result: "Resultado: un problema claramente definido y medible." },
  { number: "02", title: "Diseñar", text: "Definimos componentes, contratos y flujos antes de integrar.", signal: "ORDENAR", details: ["Organizar la arquitectura de información", "Prototipar recorridos y estados de interfaz", "Revisar accesibilidad antes de construir"], result: "Resultado: una solución coherente, usable y lista para implementar." },
  { number: "03", title: "Construir", text: "Implementamos piezas legibles, enfocadas y reutilizables.", signal: "CONECTAR", details: ["Crear módulos pequeños y mantenibles", "Integrar datos con manejo controlado de errores", "Optimizar rendimiento en distintos dispositivos"], result: "Resultado: una experiencia funcional que puede evolucionar sin duplicación." },
  { number: "04", title: "Validar", text: "Probamos rutas, estados, accesibilidad y comportamiento completo.", signal: "COMPROBAR", details: ["Ejecutar pruebas funcionales y de roles", "Revisar teclado, contraste y movimiento reducido", "Documentar hallazgos y aplicar mejoras"], result: "Resultado: una entrega verificable, inclusiva y preparada para producción." }
]);

function buildAnimatedWords(value) {
  return String(value).split(/\s+/).map(word => `<span data-standard-word>${word}</span>`).join(" ");
}

function buildParticleMarkup() {
  const shapes = ["circle", "square", "diamond", "pill", "cross"];
  const tones = ["ink", "blue", "lime", "pink", "soft"];

  return Array.from({ length: 34 }, (_, index) => {
    const x = (index * 29 + 7) % 96;
    const y = (index * 41 + 13) % 88;
    const size = 7 + ((index * 11) % 19);
    const shape = shapes[index % shapes.length];
    const tone = tones[(index * 3) % tones.length];

    return `<span class="home-particle home-particle--${shape} home-particle--${tone}" data-particle style="--particle-x:${x}%;--particle-y:${y}%;--particle-size:${size}px"></span>`;
  }).join("");
}

function buildStandardsMarkup() {
  const options = standards.map((item, index) => `<button
    id="standard-option-${index}"
    class="standard-option${index === 0 ? " is-active" : ""}"
    type="button"
    role="tab"
    aria-selected="${index === 0}"
    aria-controls="standard-detail-panel"
    tabindex="${index === 0 ? 0 : -1}"
    data-standard-index="${index}">
      <span>${item.number}</span>
      <strong>${item.title}</strong>
      <i aria-hidden="true">↗</i>
    </button>`).join("");
  const initial = standards[0];
  const points = initial.points.map(point => `<li><span aria-hidden="true"></span>${point}</li>`).join("");

  return `<div class="standards-explorer" data-standards-explorer data-reveal-item>
    <div class="standard-options" role="tablist" aria-label="Estándares de JobConnect">${options}</div>
    <article
      id="standard-detail-panel"
      class="standard-detail"
      role="tabpanel"
      aria-labelledby="standard-option-0"
      aria-live="polite"
      aria-atomic="true"
      tabindex="0"
      data-standard-detail
      data-standard-visual="1"
      data-tone="${initial.tone}">
        <div class="standard-detail__top">
          <span data-standard-category>${initial.category}</span>
          <div class="standard-detail__progress" aria-label="Estándar 1 de ${standards.length}">
            <span data-standard-progress>01 / 06</span>
            <i aria-hidden="true"><b data-standard-progress-bar style="width:${100 / standards.length}%"></b></i>
          </div>
          <strong data-standard-number>${initial.number}</strong>
        </div>
        <div class="standard-detail__visual" aria-hidden="true"><span></span><span></span><i></i></div>
        <div class="standard-detail__content">
          <h3 data-standard-title>${buildAnimatedWords(initial.title)}</h3>
          <p data-standard-text>${initial.text}</p>
          <ul data-standard-points>${points}</ul>
        </div>
    </article>
  </div>`;
}

function buildProcessMarkup() {
  const steps = processSteps.map((step, index) => `<li>
    <button class="process-step" type="button" data-process-step data-process-index="${index}" data-layout-id="process-${index}" data-duration="${650 + index * 100}" aria-haspopup="dialog">
      <span data-layout-id="process-${index}-number">${step.number}</span>
      <strong data-layout-id="process-${index}-title">${step.title}</strong>
      <p>${step.text}</p>
      <div class="process-step__details"><small>${step.signal}</small><ul>${step.details.map(detail => `<li>${detail}</li>`).join("")}</ul><b>${step.result}</b></div>
      <i aria-hidden="true">↗</i>
    </button>
  </li>`).join("");

  return `<div class="process-story process-layout-grid" data-process-story data-reveal-item>
    <ol class="process-list" aria-label="Etapas de trabajo">${steps}</ol>
  </div>`;
}

function setupStandardsExplorer(container) {
  if (typeof container?.querySelector !== "function") return () => {};

  const explorer = container.querySelector("[data-standards-explorer]");
  if (!explorer) return () => {};

  const options = [...explorer.querySelectorAll("[data-standard-index]")];
  const detail = explorer.querySelector("[data-standard-detail]");
  const category = explorer.querySelector("[data-standard-category]");
  const number = explorer.querySelector("[data-standard-number]");
  const title = explorer.querySelector("[data-standard-title]");
  const text = explorer.querySelector("[data-standard-text]");
  const points = explorer.querySelector("[data-standard-points]");
  const progress = explorer.querySelector("[data-standard-progress]");
  const progressBar = explorer.querySelector("[data-standard-progress-bar]");
  let activeIndex = 0;

  function selectStandard(index, { focus = false, scroll = false } = {}) {
    const item = standards[index];
    const selectedOption = options[index];
    if (!item || !selectedOption || !detail || !category || !number || !title || !text || !points || !progress || !progressBar) return;

    activeIndex = index;
    options.forEach((option, optionIndex) => {
      const isSelected = optionIndex === index;
      option.classList.toggle("is-active", isSelected);
      option.setAttribute("aria-selected", String(isSelected));
      option.tabIndex = isSelected ? 0 : -1;
    });

    detail.dataset.tone = item.tone;
    detail.dataset.standardVisual = String(index + 1);
    detail.setAttribute("aria-labelledby", selectedOption.id);
    category.textContent = item.category;
    number.textContent = item.number;
    title.replaceChildren(...item.title.split(/\s+/).map(word => {
      const wordElement = document.createElement("span");
      wordElement.dataset.standardWord = "";
      wordElement.textContent = word;
      return wordElement;
    }));
    text.textContent = item.text;
    progress.textContent = `${item.number} / ${String(standards.length).padStart(2, "0")}`;
    progressBar.style.width = `${(index + 1) / standards.length * 100}%`;
    progress.parentElement?.setAttribute("aria-label", `Estándar ${index + 1} de ${standards.length}`);
    points.replaceChildren(...item.points.map(point => {
      const listItem = document.createElement("li");
      const mark = document.createElement("span");
      mark.setAttribute("aria-hidden", "true");
      listItem.append(mark, point);
      return listItem;
    }));

    const reducedMotion = document.documentElement.classList.contains("low-performance") || (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false);
    if (!reducedMotion) {
      detail.animate?.([
        { opacity: 0.72, transform: "translateY(10px) scale(0.992)" },
        { opacity: 1, transform: "translateY(0) scale(1)" }
      ], { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      for (const [wordIndex, word] of [...title.children].entries()) {
        word.animate?.([
          { opacity: 0, transform: "translateY(70%) rotate(2deg)" },
          { opacity: 1, transform: "translateY(0) rotate(0)" }
        ], { duration: 380, delay: wordIndex * 55, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" });
      }
      for (const [pointIndex, point] of [...points.children].entries()) {
        point.animate?.([
          { opacity: 0, transform: "translateX(-10px)" },
          { opacity: 1, transform: "translateX(0)" }
        ], { duration: 260, delay: 120 + pointIndex * 45, easing: "ease-out", fill: "both" });
      }
    }

    if (focus) selectedOption.focus();
    if (scroll) detail.scrollIntoView?.({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
  }

  const handleSelection = event => {
    const option = event.target?.closest?.("[data-standard-index]");
    if (!option || !explorer.contains(option)) return;
    const selectedIndex = Number(option.dataset.standardIndex);
    if (selectedIndex === activeIndex) return;
    const mobileSelection = event.type === "click" && (globalThis.matchMedia?.("(max-width: 720px)")?.matches ?? false);
    selectStandard(selectedIndex, { scroll: mobileSelection });
  };

  const handleKeyboard = event => {
    const option = event.target?.closest?.("[data-standard-index]");
    if (!option || !explorer.contains(option)) return;

    let nextIndex = activeIndex;
    if (["ArrowDown", "ArrowRight"].includes(event.key)) nextIndex = (activeIndex + 1) % options.length;
    else if (["ArrowUp", "ArrowLeft"].includes(event.key)) nextIndex = (activeIndex - 1 + options.length) % options.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = options.length - 1;
    else return;

    event.preventDefault();
    selectStandard(nextIndex, { focus: true });
  };

  explorer.addEventListener("click", handleSelection);
  explorer.addEventListener("pointerover", handleSelection);
  explorer.addEventListener("focusin", handleSelection);
  explorer.addEventListener("keydown", handleKeyboard);

  return () => {
    explorer.removeEventListener("click", handleSelection);
    explorer.removeEventListener("pointerover", handleSelection);
    explorer.removeEventListener("focusin", handleSelection);
    explorer.removeEventListener("keydown", handleKeyboard);
  };
}

function setupProcessExplorer(container) {
  if (typeof container?.querySelector !== "function") return () => {};
  const story = container.querySelector("[data-process-story]");
  if (!story) return () => {};

  const steps = [...story.querySelectorAll("[data-process-step]")];
  if (!steps.length || typeof document?.createElement !== "function") return () => {};
  const dialog = document.createElement("dialog");
  dialog.id = "process-layout-dialog";
  dialog.className = "process-layout-dialog";
  dialog.setAttribute("aria-label", "Detalle de la etapa");
  document.body.append(dialog);
  const modalLayout = createLayout(dialog, {
    children: [".process-step", ".process-step > span", ".process-step > strong", ".process-step > p", ".process-step__details", ".process-step__details li", ".process-step i"],
    properties: ["--overlay-alpha"]
  });
  let activeIndex = 0;
  let openStep = null;

  const reducedMotion = () => document.documentElement.classList.contains("low-performance") || (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false);

  function selectStep(index, { focus = false } = {}) {
    const item = processSteps[index];
    const selectedStep = steps[index];
    if (!item || !selectedStep) return;

    activeIndex = index;
    steps.forEach((step, stepIndex) => {
      const isActive = stepIndex === index;
      step.classList.toggle("is-active", isActive);
      step.setAttribute("aria-current", isActive ? "step" : "false");
    });
    if (focus) selectedStep.focus();
  }

  function closeModal(event) {
    event?.preventDefault?.();
    if (!dialog.open || !openStep) return;
    const stepToRestore = openStep;
    modalLayout.update(() => {
      dialog.close();
      stepToRestore.classList.remove("is-open");
      dialog.replaceChildren();
      stepToRestore.focus();
      openStep = null;
    }, { duration: reducedMotion() ? 0 : Number(stepToRestore.dataset.duration) || 650, ease: "inOut(3)" });
  }

  function openModal(step) {
    if (!step || dialog.open) return;
    const index = Number(step.dataset.processIndex);
    selectStep(index);
    const clone = step.cloneNode(true);
    clone.removeAttribute("data-process-step");
    clone.removeAttribute("aria-haspopup");
    clone.classList.add("process-step--dialog");
    clone.querySelector("p")?.removeAttribute("hidden");
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "process-layout-dialog__close";
    closeButton.dataset.processDialogClose = "";
    closeButton.setAttribute("aria-label", "Cerrar detalle");
    closeButton.textContent = "×";
    dialog.replaceChildren(clone, closeButton);
    openStep = step;
    modalLayout.update(() => {
      dialog.showModal();
      step.classList.add("is-open");
      closeButton.focus({ preventScroll: true });
    }, { duration: reducedMotion() ? 0 : Number(step.dataset.duration) || 650, ease: "inOut(3)" });
  }

  const handleSelection = event => {
    const step = event.target?.closest?.("[data-process-step]");
    if (!step || !story.contains(step)) return;
    openModal(step);
  };
  const handleKeyboard = event => {
    const step = event.target?.closest?.("[data-process-step]");
    if (!step || !story.contains(step) || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = activeIndex;
    if (event.key === "ArrowDown") nextIndex = (activeIndex + 1) % steps.length;
    if (event.key === "ArrowUp") nextIndex = (activeIndex - 1 + steps.length) % steps.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = steps.length - 1;
    selectStep(nextIndex, { focus: true });
  };
  const handleDialogClick = event => {
    if (event.target === dialog || event.target.closest?.("[data-process-dialog-close]")) closeModal(event);
  };

  story.addEventListener("click", handleSelection);
  story.addEventListener("keydown", handleKeyboard);
  dialog.addEventListener("cancel", closeModal);
  dialog.addEventListener("click", handleDialogClick);

  return () => {
    story.removeEventListener("click", handleSelection);
    story.removeEventListener("keydown", handleKeyboard);
    dialog.removeEventListener("cancel", closeModal);
    dialog.removeEventListener("click", handleDialogClick);
    dialog.close?.();
    dialog.remove();
  };
}

export function buildHomeMarkup() {
  return `<div class="home-experience">
    <section class="home-hero" aria-labelledby="home-title">
      <video
        class="home-jellyfish-video"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4"
        autoplay
        muted
        loop
        playsinline
        aria-hidden="true"></video>
      <span class="home-cursor-aura" data-cursor-aura aria-hidden="true"></span>
      <div class="home-particle-field" data-particle-field aria-hidden="true"><div class="home-core-object" data-hero-core><span></span><span></span><i></i></div>${buildParticleMarkup()}</div>
      <div class="home-hero__top">
        <p class="home-kicker" data-hero-kicker>TECNOLOGÍA + TALENTO / 2026</p>
        <span class="home-status"><span class="home-status__dot" aria-hidden="true"></span><span data-motion-label>Preparando movimiento</span></span>
      </div>
      <h1 id="home-title" class="home-title" data-hero-title aria-label="Conectamos talento con futuro">
        <span data-hero-line data-blur-text>Conectamos</span>
        <span class="home-title__outline" data-hero-line data-blur-text>talento</span>
        <span data-hero-line data-blur-text>con futuro.</span>
      </h1>
      <div class="home-hero__footer" data-hero-footer>
        <p>Una plataforma digital para organizar oportunidades, personas y procesos de empleabilidad desde un solo lugar.</p>
        <div class="home-actions">
          <button type="button" class="home-button home-button--dark" data-cursor="Explorar" data-home-target="candidates">Explorar talento <span aria-hidden="true">↗</span></button>
          <button type="button" class="home-button home-button--ghost" data-cursor="Ver" data-home-target="vacancies">Ver vacantes <span aria-hidden="true">→</span></button>
        </div>
      </div>
      <div class="home-scroll-cue" aria-hidden="true"><span>DESPLÁZATE</span><i></i></div>
    </section>

    <section class="home-story" aria-labelledby="story-title" data-reveal-section>
      <div class="home-section-label"><span>01</span><p>SOMOS JOBCONNECT</p></div>
      <div class="home-story__grid">
        <h2 id="story-title">Tecnología que acerca a las personas correctas.</h2>
        <div class="home-story__copy">
          <p>Somos una empresa digital orientada a la gestión de empleabilidad. Conectamos talento, empresas y equipos de reclutamiento mediante una experiencia clara, ordenada y confiable.</p>
          <p>Nuestra solución centraliza candidatos, vacantes, empresas, postulaciones, entrevistas y tareas, haciendo visible cada paso del proceso.</p>
        </div>
      </div>
    </section>

    <section class="home-process" aria-labelledby="process-title" data-reveal-section>
      <div class="home-section-label"><span>02</span><p>NUESTRA FORMA DE TRABAJAR</p></div>
      <div class="home-process__heading">
        <h2 id="process-title">Del problema a una solución verificable.</h2>
        <p>Un proceso simple para reducir incertidumbre y entregar valor real.</p>
      </div>
      ${buildProcessMarkup()}
    </section>

    <section class="home-final" aria-labelledby="home-final-title" data-reveal-section>
      <div class="home-final__orbit" data-final-orbit aria-hidden="true"><span></span><span></span><i></i></div>
      <p>LISTOS PARA CONECTAR</p>
      <h2 id="home-final-title">El próximo gran talento ya está más cerca.</h2>
      <button type="button" class="home-button home-button--light" data-cursor="Entrar" data-home-target="vacancies">Comenzar ahora <span aria-hidden="true">↗</span></button>
    </section>
  </div>`;
}

let mountedContainer = null;
let removeMotion = () => {};
let removeEvents = () => {};
let mountVersion = 0;

export async function mount(container, services = {}) {
  if (!container) throw new Error("No se encontró el contenedor de Inicio.");

  unmount();
  const version = ++mountVersion;
  mountedContainer = container;
  container.innerHTML = buildHomeMarkup();

  const clickHandler = event => {
    const button = event.target?.closest?.("[data-home-target]");
    if (!button || !container.contains(button) || typeof services.navigate !== "function") return;

    Promise.resolve(services.navigate(button.dataset.homeTarget)).catch(error => {
      services.feedback?.error?.(error.message || "No se pudo abrir la sección seleccionada.");
    });
  };

  container.addEventListener("click", clickHandler);
  const removeProcessExplorer = setupProcessExplorer(container);
  removeEvents = () => {
    container.removeEventListener("click", clickHandler);
    removeProcessExplorer();
  };

  try {
    const motion = services.motion ?? await import("../../animations/home-motion.js?v=lumen-1");
    if (version !== mountVersion || mountedContainer !== container) return;
    removeMotion = motion.initHomeMotion?.(container) ?? (() => {});
  } catch (error) {
    if (version === mountVersion && mountedContainer === container) {
      container.classList.add("motion-unavailable");
      const motionLabel = container.querySelector("[data-motion-label]");
      if (motionLabel) motionLabel.textContent = "Movimiento no disponible";
      services.feedback?.error?.("No se pudieron cargar las animaciones avanzadas de Inicio.");
      console.error("JobConnect no pudo iniciar las animaciones de Inicio.", error);
    }
  }
}

export function unmount() {
  mountVersion += 1;
  removeMotion();
  removeEvents();
  removeMotion = () => {};
  removeEvents = () => {};
  mountedContainer?.replaceChildren();
  mountedContainer = null;
}
