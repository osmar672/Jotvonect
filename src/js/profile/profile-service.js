export const PROFILE_KEY_PREFIX = "jobconnect.profile.";

export const ACCOUNT_TYPES = Object.freeze([
  Object.freeze({ value: "job-seeker", label: "Busco trabajo" }),
  Object.freeze({ value: "recruiter", label: "Soy reclutador/a" }),
  Object.freeze({ value: "company", label: "Represento una empresa" })
]);

export const SOFT_SKILLS = Object.freeze([
  "Comunicación",
  "Trabajo en equipo",
  "Adaptabilidad",
  "Liderazgo",
  "Resolución de problemas",
  "Organización",
  "Empatía",
  "Pensamiento crítico"
]);

const ACCOUNT_TYPE_VALUES = new Set(ACCOUNT_TYPES.map(type => type.value));

function cleanText(value, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function normalizeList(value, fallback = []) {
  const wasProvided = value !== undefined && value !== null;
  const values = Array.isArray(value)
    ? value
    : String(value ?? "").split(/[\n,]/);

  const normalized = values
    .map(item => cleanText(item))
    .filter(Boolean);

  return [...new Set(normalized.length || wasProvided ? normalized : fallback)];
}

function clampDistance(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 35;
  return Math.min(250, Math.max(5, Math.round(parsed / 5) * 5));
}

function cloneProfile(profile) {
  return JSON.parse(JSON.stringify(profile));
}

export function getProfileStorageKey(user = {}) {
  const identity = cleanText(user.id ?? user.username ?? user.email, "guest")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-");

  return `${PROFILE_KEY_PREFIX}${identity}`;
}

export function createDefaultProfile(user = {}) {
  const suppliedName = `${cleanText(user.firstName)} ${cleanText(user.lastName)}`.trim();
  const fullName = suppliedName || cleanText(user.username, "Emily Johnson");

  return {
    accountType: "job-seeker",
    fullName,
    email: cleanText(user.email, "emily.johnson@example.com"),
    country: "Costa Rica",
    province: "San José",
    jobSeeker: {
      desiredJob: "Desarrollo frontend",
      preferredModality: "Híbrido",
      diplomas: ["Bachillerato en Educación Media"],
      technicalSkills: ["HTML", "CSS", "JavaScript"],
      softSkills: ["Comunicación", "Trabajo en equipo", "Resolución de problemas"],
      willingToRelocate: false,
      maxDistanceKm: 35
    },
    recruiter: {
      organization: "",
      position: "",
      recruitingAreas: [],
      coverage: "Nacional"
    },
    company: {
      companyName: "",
      sector: "",
      description: "",
      vacancyTypes: [],
      remoteWork: false
    },
    updatedAt: null
  };
}

export function normalizeProfile(input = {}, user = {}) {
  const defaults = createDefaultProfile(user);
  const jobSeeker = input.jobSeeker ?? {};
  const recruiter = input.recruiter ?? {};
  const company = input.company ?? {};

  return {
    accountType: ACCOUNT_TYPE_VALUES.has(input.accountType) ? input.accountType : defaults.accountType,
    fullName: cleanText(input.fullName, defaults.fullName),
    email: cleanText(input.email, defaults.email),
    country: cleanText(input.country, defaults.country),
    province: cleanText(input.province, defaults.province),
    jobSeeker: {
      desiredJob: cleanText(jobSeeker.desiredJob, defaults.jobSeeker.desiredJob),
      preferredModality: cleanText(jobSeeker.preferredModality, defaults.jobSeeker.preferredModality),
      diplomas: normalizeList(jobSeeker.diplomas, defaults.jobSeeker.diplomas),
      technicalSkills: normalizeList(jobSeeker.technicalSkills, defaults.jobSeeker.technicalSkills),
      softSkills: normalizeList(jobSeeker.softSkills, defaults.jobSeeker.softSkills)
        .filter(skill => SOFT_SKILLS.includes(skill)),
      willingToRelocate: Boolean(jobSeeker.willingToRelocate),
      maxDistanceKm: clampDistance(jobSeeker.maxDistanceKm)
    },
    recruiter: {
      organization: cleanText(recruiter.organization),
      position: cleanText(recruiter.position),
      recruitingAreas: normalizeList(recruiter.recruitingAreas),
      coverage: cleanText(recruiter.coverage, defaults.recruiter.coverage)
    },
    company: {
      companyName: cleanText(company.companyName),
      sector: cleanText(company.sector),
      description: cleanText(company.description),
      vacancyTypes: normalizeList(company.vacancyTypes),
      remoteWork: Boolean(company.remoteWork)
    },
    updatedAt: input.updatedAt || defaults.updatedAt
  };
}

export function getAccountTypeLabel(accountType) {
  return ACCOUNT_TYPES.find(type => type.value === accountType)?.label || ACCOUNT_TYPES[0].label;
}

export function createProfileService(user = {}, storage = globalThis.localStorage) {
  const storageKey = getProfileStorageKey(user);
  let currentProfile = createDefaultProfile(user);

  try {
    const storedProfile = JSON.parse(storage?.getItem(storageKey) || "null");
    if (storedProfile) currentProfile = normalizeProfile(storedProfile, user);
  } catch {
    currentProfile = createDefaultProfile(user);
  }

  function get() {
    return cloneProfile(currentProfile);
  }

  function save(profile) {
    currentProfile = normalizeProfile({ ...profile, updatedAt: new Date().toISOString() }, user);
    try {
      storage?.setItem(storageKey, JSON.stringify(currentProfile));
    } catch {
      // El perfil continúa disponible en memoria si el navegador bloquea el almacenamiento.
    }
    return get();
  }

  function reset() {
    currentProfile = createDefaultProfile(user);
    try {
      storage?.removeItem(storageKey);
    } catch {
      // Restablecer el estado en memoria sigue siendo seguro.
    }
    return get();
  }

  return Object.freeze({ get, save, reset, storageKey });
}
