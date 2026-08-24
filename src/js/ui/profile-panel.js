import { ACCOUNT_TYPES, SOFT_SKILLS, getAccountTypeLabel } from "../profile/profile-service.js";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[character]));
}

function selected(value, expected) {
  return value === expected ? " selected" : "";
}

function checked(value) {
  return value ? " checked" : "";
}

function asLines(values) {
  return escapeHtml((values ?? []).join("\n"));
}

export function getProfileInitials(fullName) {
  const parts = String(fullName || "Usuario").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(part => part[0]).join("").toUpperCase() || "US";
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return true;
  return String(value ?? "").trim().length > 0;
}

function asPreviewTags(value) {
  const values = Array.isArray(value) ? value : String(value ?? "").split(/[\n,]/);
  return values.map(item => String(item).trim()).filter(Boolean);
}

export function getProfileCompletion(profile) {
  const common = [profile.fullName, profile.email, profile.country, profile.province];
  let specific = [];

  if (profile.accountType === "recruiter") {
    specific = [profile.recruiter.organization, profile.recruiter.position, profile.recruiter.coverage, profile.recruiter.recruitingAreas];
  } else if (profile.accountType === "company") {
    specific = [profile.company.companyName, profile.company.sector, profile.company.description, profile.company.vacancyTypes];
  } else {
    specific = [
      profile.jobSeeker.desiredJob,
      profile.jobSeeker.preferredModality,
      profile.jobSeeker.diplomas,
      profile.jobSeeker.technicalSkills,
      profile.jobSeeker.softSkills
    ];
  }

  const values = [...common, ...specific];
  return Math.round(values.filter(hasValue).length / values.length * 100);
}

function getPreviewData(profile) {
  if (profile.accountType === "recruiter") {
    return {
      eyebrow: "PERFIL DE RECLUTAMIENTO",
      title: profile.recruiter.position || "Especialista de talento",
      subtitle: profile.recruiter.organization || "Organización por definir",
      note: `${profile.recruiter.coverage || "Nacional"} · ${profile.country}`,
      tags: asPreviewTags(profile.recruiter.recruitingAreas)
    };
  }

  if (profile.accountType === "company") {
    return {
      eyebrow: "PERFIL DE EMPRESA",
      title: profile.company.companyName || "Nombre de la empresa",
      subtitle: profile.company.sector || "Sector por definir",
      note: profile.company.remoteWork ? "Oportunidades remotas disponibles" : `${profile.province}, ${profile.country}`,
      tags: asPreviewTags(profile.company.vacancyTypes)
    };
  }

  return {
    eyebrow: "PERFIL DE TALENTO",
    title: profile.jobSeeker.desiredJob || "Objetivo profesional",
    subtitle: profile.fullName,
      note: profile.jobSeeker.willingToRelocate
        ? "Disponibilidad para trasladarse"
        : `Hasta ${profile.jobSeeker.maxDistanceKm} km · ${profile.province}`,
      tags: [...asPreviewTags(profile.jobSeeker.technicalSkills), ...asPreviewTags(profile.jobSeeker.softSkills)]
  };
}

export function buildProfilePreviewMarkup(profile) {
  const preview = getPreviewData(profile);
  const tags = (preview.tags || []).slice(0, 5);
  const tagMarkup = tags.length
    ? tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join("")
    : "<span>Agrega habilidades o áreas</span>";

  return `<article class="profile-preview" data-profile-preview data-preview-type="${escapeHtml(profile.accountType)}">
    <div class="profile-preview__top"><span>${escapeHtml(preview.eyebrow)}</span><i aria-hidden="true"></i></div>
    <div class="profile-preview__identity"><span class="profile-preview__avatar">${getProfileInitials(profile.fullName)}</span><div><strong>${escapeHtml(preview.title)}</strong><p>${escapeHtml(preview.subtitle)}</p></div></div>
    <div class="profile-preview__tags">${tagMarkup}</div>
    <p class="profile-preview__location">${escapeHtml(preview.note)}</p>
    <div class="profile-preview__orbit" aria-hidden="true"><span></span><i></i></div>
  </article>`;
}

function buildSoftSkillsMarkup(selectedSkills = []) {
  return SOFT_SKILLS.map(skill => `<label class="skill-option">
    <input type="checkbox" name="softSkills" value="${escapeHtml(skill)}"${checked(selectedSkills.includes(skill))}>
    <span>${escapeHtml(skill)}</span>
  </label>`).join("");
}

export function buildAccountFieldsMarkup(profile) {
  if (profile.accountType === "recruiter") {
    return `<section class="profile-form-section" aria-labelledby="recruiter-fields-title">
      <div class="profile-section-heading">
        <span>02</span>
        <div><h3 id="recruiter-fields-title">Información de reclutamiento</h3><p>Configura las áreas y cobertura de tus búsquedas.</p></div>
      </div>
      <div class="profile-field-grid">
        <label>Organización
          <input name="organization" value="${escapeHtml(profile.recruiter.organization)}" placeholder="Nombre de la organización">
        </label>
        <label>Cargo
          <input name="recruiterPosition" value="${escapeHtml(profile.recruiter.position)}" placeholder="Ej. Especialista de talento">
        </label>
        <label>Cobertura
          <select name="coverage">
            <option${selected(profile.recruiter.coverage, "Local")}>Local</option>
            <option${selected(profile.recruiter.coverage, "Nacional")}>Nacional</option>
            <option${selected(profile.recruiter.coverage, "Internacional")}>Internacional</option>
          </select>
        </label>
        <label class="profile-field--wide">Áreas en las que recluta
          <textarea name="recruitingAreas" placeholder="Una por línea: Tecnología, Finanzas, Ventas…">${asLines(profile.recruiter.recruitingAreas)}</textarea>
        </label>
      </div>
    </section>`;
  }

  if (profile.accountType === "company") {
    return `<section class="profile-form-section" aria-labelledby="company-fields-title">
      <div class="profile-section-heading">
        <span>02</span>
        <div><h3 id="company-fields-title">Perfil de empresa</h3><p>Describe la organización y las oportunidades que ofrece.</p></div>
      </div>
      <div class="profile-field-grid">
        <label>Nombre de la empresa
          <input name="companyName" value="${escapeHtml(profile.company.companyName)}" placeholder="Nombre comercial">
        </label>
        <label>Sector
          <input name="sector" value="${escapeHtml(profile.company.sector)}" placeholder="Ej. Tecnología">
        </label>
        <label class="profile-field--wide">Descripción
          <textarea name="companyDescription" placeholder="Qué hace la empresa y qué la diferencia">${escapeHtml(profile.company.description)}</textarea>
        </label>
        <label class="profile-field--wide">Tipos de vacantes
          <textarea name="vacancyTypes" placeholder="Una por línea: Desarrollo, Soporte, Diseño…">${asLines(profile.company.vacancyTypes)}</textarea>
        </label>
        <label class="profile-switch profile-field--wide">
          <input type="checkbox" name="remoteWork"${checked(profile.company.remoteWork)}>
          <span><strong>Ofrecemos trabajo remoto</strong><small>Las vacantes pueden realizarse fuera de la oficina.</small></span>
        </label>
      </div>
    </section>`;
  }

  const seeker = profile.jobSeeker;
  return `<section class="profile-form-section" aria-labelledby="seeker-fields-title">
    <div class="profile-section-heading">
      <span>02</span>
      <div><h3 id="seeker-fields-title">Objetivo profesional</h3><p>Cuéntanos qué buscas y qué puedes aportar.</p></div>
    </div>
    <div class="profile-field-grid">
      <label>Tipo de trabajo que buscas
        <input name="desiredJob" value="${escapeHtml(seeker.desiredJob)}" placeholder="Ej. Desarrollo frontend" required>
      </label>
      <label>Modalidad preferida
        <select name="preferredModality">
          <option${selected(seeker.preferredModality, "Presencial")}>Presencial</option>
          <option${selected(seeker.preferredModality, "Híbrido")}>Híbrido</option>
          <option${selected(seeker.preferredModality, "Remoto")}>Remoto</option>
          <option${selected(seeker.preferredModality, "Cualquiera")}>Cualquiera</option>
        </select>
      </label>
      <label class="profile-field--wide">Diplomas y certificaciones
        <textarea name="diplomas" placeholder="Uno por línea">${asLines(seeker.diplomas)}</textarea>
      </label>
      <label class="profile-field--wide">Conocimientos y habilidades técnicas
        <textarea name="technicalSkills" placeholder="Una por línea: JavaScript, Excel, Redes…">${asLines(seeker.technicalSkills)}</textarea>
      </label>
      <fieldset class="soft-skills profile-field--wide">
        <legend>Características y habilidades blandas</legend>
        <div class="soft-skills__grid">${buildSoftSkillsMarkup(seeker.softSkills)}</div>
      </fieldset>
    </div>
  </section>

  <section class="profile-form-section" aria-labelledby="mobility-fields-title">
    <div class="profile-section-heading">
      <span>03</span>
      <div><h3 id="mobility-fields-title">Movilidad</h3><p>Define a qué distancia aceptarías una oportunidad.</p></div>
    </div>
    <label class="profile-switch">
      <input type="checkbox" name="willingToRelocate" data-relocation${checked(seeker.willingToRelocate)}>
      <span><strong>No tengo problema en trasladarme</strong><small>Considerar oportunidades sin límite de distancia.</small></span>
    </label>
    <div class="distance-control" data-distance-control>
      <div class="distance-control__heading">
        <label for="maximum-distance">Distancia máxima desde mi ubicación</label>
        <output for="maximum-distance" data-distance-output>${seeker.maxDistanceKm} km</output>
      </div>
      <input id="maximum-distance" type="range" name="maxDistanceKm" min="5" max="250" step="5" value="${seeker.maxDistanceKm}" data-distance-input>
      <div class="distance-control__scale"><span>5 km</span><span>250 km</span></div>
    </div>
  </section>`;
}

export function buildProfilePanelMarkup(profile) {
  const accountOptions = ACCOUNT_TYPES.map(type => `<option value="${type.value}"${selected(profile.accountType, type.value)}>${escapeHtml(type.label)}</option>`).join("");
  const completion = getProfileCompletion(profile);

  return `<div class="profile-panel__header">
    <div>
      <p class="eyebrow">CUENTA Y PREFERENCIAS</p>
      <h2>Configurar perfil</h2>
    </div>
    <button type="button" class="panel-close" data-profile-close aria-label="Cerrar perfil">×</button>
  </div>
  <div class="profile-summary">
    <span class="profile-summary__avatar" data-profile-panel-initials>${getProfileInitials(profile.fullName)}</span>
    <div><strong data-profile-panel-name>${escapeHtml(profile.fullName)}</strong><span data-profile-panel-type>${escapeHtml(getAccountTypeLabel(profile.accountType))}</span></div>
    <div class="profile-completion" data-profile-completion style="--profile-progress:${completion * 3.6}deg"><strong data-profile-completion-value>${completion}%</strong><span>COMPLETO</span></div>
  </div>
  <div class="profile-preview-slot" data-profile-preview-slot>${buildProfilePreviewMarkup(profile)}</div>
  <form class="profile-form" data-profile-form>
    <section class="profile-form-section" aria-labelledby="personal-fields-title">
      <div class="profile-section-heading">
        <span>01</span>
        <div><h3 id="personal-fields-title">Datos principales</h3><p>Esta información identifica tu cuenta.</p></div>
      </div>
      <div class="profile-field-grid">
        <label class="profile-field--wide">Tipo de cuenta
          <select name="accountType" data-account-type>${accountOptions}</select>
        </label>
        <label>Nombre completo
          <input name="fullName" value="${escapeHtml(profile.fullName)}" autocomplete="name" required>
        </label>
        <label>Correo electrónico
          <input name="email" type="email" value="${escapeHtml(profile.email)}" autocomplete="email" required>
        </label>
        <label>País
          <input name="country" value="${escapeHtml(profile.country)}" autocomplete="country-name" required>
        </label>
        <label>Provincia o estado
          <input name="province" value="${escapeHtml(profile.province)}" autocomplete="address-level1" required>
        </label>
      </div>
    </section>
    <div data-account-fields>${buildAccountFieldsMarkup(profile)}</div>
    <p class="profile-save-status" role="status" aria-live="polite" data-profile-status></p>
    <div class="profile-panel__actions">
      <button type="button" class="profile-logout" data-profile-logout>Cerrar sesión</button>
      <button type="submit" class="btn btn--primary">Guardar cambios</button>
    </div>
  </form>`;
}

function collectProfile(form, profile, accountType = profile.accountType) {
  const formData = new FormData(form);
  const nextProfile = {
    ...profile,
    accountType: String(formData.get("accountType") || profile.accountType),
    fullName: String(formData.get("fullName") || ""),
    email: String(formData.get("email") || ""),
    country: String(formData.get("country") || ""),
    province: String(formData.get("province") || "")
  };

  if (accountType === "job-seeker") {
    nextProfile.jobSeeker = {
      ...profile.jobSeeker,
      desiredJob: String(formData.get("desiredJob") || ""),
      preferredModality: String(formData.get("preferredModality") || "Híbrido"),
      diplomas: String(formData.get("diplomas") || ""),
      technicalSkills: String(formData.get("technicalSkills") || ""),
      softSkills: [...form.querySelectorAll("[name='softSkills']:checked")].map(input => input.value),
      willingToRelocate: Boolean(form.querySelector("[name='willingToRelocate']")?.checked),
      maxDistanceKm: form.querySelector("[name='maxDistanceKm']")?.value ?? profile.jobSeeker.maxDistanceKm
    };
  } else if (accountType === "recruiter") {
    nextProfile.recruiter = {
      ...profile.recruiter,
      organization: String(formData.get("organization") || ""),
      position: String(formData.get("recruiterPosition") || ""),
      recruitingAreas: String(formData.get("recruitingAreas") || ""),
      coverage: String(formData.get("coverage") || "Nacional")
    };
  } else if (accountType === "company") {
    nextProfile.company = {
      ...profile.company,
      companyName: String(formData.get("companyName") || ""),
      sector: String(formData.get("sector") || ""),
      description: String(formData.get("companyDescription") || ""),
      vacancyTypes: String(formData.get("vacancyTypes") || ""),
      remoteWork: Boolean(form.querySelector("[name='remoteWork']")?.checked)
    };
  }

  return nextProfile;
}

export function createProfilePanel({ root, profileService, onClose, onLogout, onSave, interfaceMotion }) {
  if (!root || !profileService) throw new Error("No se pudo configurar el panel de perfil.");

  let profile = profileService.get();
  let activeAccountType = profile.accountType;
  root.innerHTML = buildProfilePanelMarkup(profile);

  const form = root.querySelector("[data-profile-form]");
  const accountTypeSelect = root.querySelector("[data-account-type]");
  const accountFields = root.querySelector("[data-account-fields]");
  const status = root.querySelector("[data-profile-status]");
  const closeButton = root.querySelector("[data-profile-close]");
  const logoutButton = root.querySelector("[data-profile-logout]");

  function updatePanelSummary() {
    const completion = getProfileCompletion(profile);
    root.querySelector("[data-profile-panel-initials]").textContent = getProfileInitials(profile.fullName);
    root.querySelector("[data-profile-panel-name]").textContent = profile.fullName;
    root.querySelector("[data-profile-panel-type]").textContent = getAccountTypeLabel(profile.accountType);
    const completionRing = root.querySelector("[data-profile-completion]");
    const completionValue = root.querySelector("[data-profile-completion-value]");
    completionRing?.style?.setProperty("--profile-progress", `${completion * 3.6}deg`);
    if (completionValue) completionValue.textContent = `${completion}%`;
    const previewSlot = root.querySelector("[data-profile-preview-slot]");
    if (previewSlot) previewSlot.innerHTML = buildProfilePreviewMarkup(profile);
    root.dataset.profileAccount = profile.accountType;
  }

  function bindMobilityControls() {
    const relocation = root.querySelector("[data-relocation]");
    const distanceControl = root.querySelector("[data-distance-control]");
    const distanceInput = root.querySelector("[data-distance-input]");
    const distanceOutput = root.querySelector("[data-distance-output]");
    if (!relocation || !distanceControl || !distanceInput || !distanceOutput) return;

    const updateDistance = () => {
      distanceOutput.textContent = `${distanceInput.value} km`;
    };
    const updateRelocation = () => {
      distanceControl.classList.toggle("is-disabled", relocation.checked);
      distanceControl.setAttribute("aria-disabled", String(relocation.checked));
      distanceInput.disabled = relocation.checked;
      distanceOutput.textContent = relocation.checked ? "Sin límite" : `${distanceInput.value} km`;
    };

    distanceInput.addEventListener("input", updateDistance);
    relocation.addEventListener("change", updateRelocation);
    updateRelocation();
  }

  function renderAccountFields() {
    accountFields.innerHTML = buildAccountFieldsMarkup(profile);
    bindMobilityControls();
    interfaceMotion?.animateAccountFields?.(accountFields);
  }

  function handleAccountTypeChange() {
    profile = collectProfile(form, profile, activeAccountType);
    profile.accountType = accountTypeSelect.value;
    activeAccountType = profile.accountType;
    status.className = "profile-save-status";
    status.textContent = "Completa los campos correspondientes al tipo de cuenta seleccionado.";
    renderAccountFields();
    updatePanelSummary();
  }

  function handleSubmit(event) {
    event.preventDefault();
    profile = collectProfile(form, profile, activeAccountType);
    profile = profileService.save(profile);
    activeAccountType = profile.accountType;
    status.textContent = "Perfil y preferencias guardados correctamente.";
    status.className = "profile-save-status is-success";
    updatePanelSummary();
    interfaceMotion?.highlight?.(root.querySelector("[data-profile-preview]"));
    onSave?.(profile);
  }

  function handleLiveInput() {
    profile = collectProfile(form, profile, activeAccountType);
    updatePanelSummary();
  }

  function handleLogout() {
    onClose?.();
    onLogout?.();
  }

  const handleClose = () => onClose?.();

  accountTypeSelect.addEventListener("change", handleAccountTypeChange);
  form.addEventListener("input", handleLiveInput);
  form.addEventListener("submit", handleSubmit);
  closeButton.addEventListener("click", handleClose);
  logoutButton.addEventListener("click", handleLogout);
  bindMobilityControls();

  function destroy() {
    accountTypeSelect.removeEventListener("change", handleAccountTypeChange);
    form.removeEventListener("input", handleLiveInput);
    form.removeEventListener("submit", handleSubmit);
    closeButton.removeEventListener("click", handleClose);
    logoutButton.removeEventListener("click", handleLogout);
    root.replaceChildren();
  }

  return Object.freeze({ destroy, getProfile: () => profileService.get() });
}
