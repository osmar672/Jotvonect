const PREFIX = "jobconnect.resumes.";
const APPLICATION_PREFIX = "jobconnect.applications.";

function identity(user = {}) {
  return String(user.id ?? user.username ?? "guest").replace(/[^a-z0-9._-]/gi, "-");
}

function read(storage, key) {
  try { return JSON.parse(storage?.getItem(key) || "[]"); } catch { return []; }
}

export function createResumeService(user = {}, storage = globalThis.localStorage) {
  const resumeKey = `${PREFIX}${identity(user)}`;
  const applicationKey = `${APPLICATION_PREFIX}${identity(user)}`;

  const list = () => read(storage, resumeKey);
  const save = records => storage?.setItem(resumeKey, JSON.stringify(records));

  async function addFiles(files) {
    const accepted = [...files].filter(file => ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type));
    if (!accepted.length) throw new Error("Selecciona al menos un currículum PDF, DOC o DOCX.");
    const created = accepted.map(file => ({
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }));
    save([...created, ...list()]);
    return created;
  }

  function remove(id) { save(list().filter(item => item.id !== id)); }

  function apply(vacancy, resumeId) {
    const resume = list().find(item => item.id === resumeId);
    if (!resume) throw new Error("El currículum seleccionado ya no está disponible.");
    const applications = read(storage, applicationKey);
    const record = { id: `${Date.now()}`, vacancyId: vacancy.id, vacancyTitle: vacancy.title, resumeId, resumeName: resume.name, appliedAt: new Date().toISOString() };
    storage?.setItem(applicationKey, JSON.stringify([record, ...applications]));
    return record;
  }

  return Object.freeze({ list, addFiles, remove, apply, resumeKey, applicationKey });
}
