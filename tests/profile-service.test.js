import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultProfile,
  createProfileService,
  getProfileStorageKey
} from "../src/js/profile/profile-service.js";

function createStorage() {
  const values = new Map();

  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
    values
  };
}

const emily = {
  id: 1,
  username: "emilys",
  firstName: "Emily",
  lastName: "Johnson",
  email: "emily.johnson@example.com"
};

test("el perfil inicial pertenece al usuario autenticado y comienza como persona que busca trabajo", () => {
  const profile = createDefaultProfile(emily);

  assert.equal(profile.fullName, "Emily Johnson");
  assert.equal(profile.email, emily.email);
  assert.equal(profile.accountType, "job-seeker");
  assert.equal(profile.country, "Costa Rica");
  assert.equal(profile.province, "San José");
  assert.ok(profile.jobSeeker.desiredJob);
  assert.ok(profile.jobSeeker.diplomas.length > 0);
  assert.ok(profile.jobSeeker.softSkills.length > 0);
});

test("guardar conserva todos los campos, normaliza listas y limita la distancia", () => {
  const storage = createStorage();
  const service = createProfileService(emily, storage);
  const draft = service.get();

  draft.fullName = "  Emily J. Johnson  ";
  draft.country = "México";
  draft.province = "Jalisco";
  draft.jobSeeker.desiredJob = "Diseño de producto";
  draft.jobSeeker.diplomas = "Licenciatura en Diseño\nCertificación UX";
  draft.jobSeeker.technicalSkills = "Figma, HTML, Figma";
  draft.jobSeeker.softSkills = ["Comunicación", "Comunicación", "Habilidad desconocida"];
  draft.jobSeeker.maxDistanceKm = 313;

  const saved = service.save(draft);
  const persisted = JSON.parse(storage.getItem(service.storageKey));

  assert.equal(saved.fullName, "Emily J. Johnson");
  assert.equal(saved.country, "México");
  assert.equal(saved.province, "Jalisco");
  assert.deepEqual(saved.jobSeeker.diplomas, ["Licenciatura en Diseño", "Certificación UX"]);
  assert.deepEqual(saved.jobSeeker.technicalSkills, ["Figma", "HTML"]);
  assert.deepEqual(saved.jobSeeker.softSkills, ["Comunicación"]);
  assert.equal(saved.jobSeeker.maxDistanceKm, 250);
  assert.equal(persisted.fullName, saved.fullName);
  assert.ok(Number.isFinite(Date.parse(saved.updatedAt)));
});

test("cada cuenta usa una clave independiente y puede restablecer su perfil", () => {
  const storage = createStorage();
  const emilyService = createProfileService(emily, storage);
  const recruiter = { id: 2, username: "recruiter", firstName: "Alex", lastName: "Rivera" };
  const recruiterService = createProfileService(recruiter, storage);

  emilyService.save({ ...emilyService.get(), fullName: "Emily Editada" });
  recruiterService.save({ ...recruiterService.get(), accountType: "recruiter", fullName: "Alex Rivera" });

  assert.notEqual(getProfileStorageKey(emily), getProfileStorageKey(recruiter));
  assert.equal(emilyService.get().fullName, "Emily Editada");
  assert.equal(recruiterService.get().accountType, "recruiter");

  const restored = emilyService.reset();
  assert.equal(restored.fullName, "Emily Johnson");
  assert.equal(storage.getItem(emilyService.storageKey), null);
  assert.ok(storage.getItem(recruiterService.storageKey));
});
