export const ROLES = Object.freeze({
  EMPLOYEE: "job-seeker",
  EMPLOYER: "employer",
  ADMIN: "admin"
});

const MODULES_BY_ROLE = Object.freeze({
  [ROLES.EMPLOYEE]: ["home", "vacancies", "companies", "resumes"],
  [ROLES.EMPLOYER]: ["home", "vacancies", "companies", "applications"],
  [ROLES.ADMIN]: ["dashboard", "home", "candidates", "vacancies", "companies", "applications", "interviews", "tasks", "resumes"]
});

export function normalizeRole(value) {
  if (value === "recruiter" || value === "company") return ROLES.EMPLOYER;
  return Object.values(ROLES).includes(value) ? value : ROLES.EMPLOYEE;
}

export function canAccessModule(role, moduleId) {
  return MODULES_BY_ROLE[normalizeRole(role)].includes(moduleId);
}

export function canManageModule(role, moduleId) {
  const normalized = normalizeRole(role);
  if (normalized === ROLES.ADMIN) return true;
  return normalized === ROLES.EMPLOYER && ["vacancies", "companies"].includes(moduleId);
}

export function filterModulesForRole(modules, role) {
  return modules.filter(module => canAccessModule(role, module.moduleMeta.id));
}
