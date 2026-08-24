import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultProfile } from "../src/js/profile/profile-service.js";
import {
  buildAccountFieldsMarkup,
  buildProfilePanelMarkup,
  buildProfilePreviewMarkup,
  getProfileCompletion,
  getProfileInitials
} from "../src/js/ui/profile-panel.js";

const user = {
  firstName: "Emily",
  lastName: "Johnson",
  email: "emily.johnson@example.com"
};

test("el panel de Emily incluye configuración personal, laboral, movilidad y cierre de sesión", () => {
  const profile = createDefaultProfile(user);
  const markup = buildProfilePanelMarkup(profile);

  assert.equal(getProfileInitials(profile.fullName), "EJ");
  assert.match(markup, /name="accountType"/);
  assert.match(markup, /name="fullName"/);
  assert.match(markup, /name="country"/);
  assert.match(markup, /name="province"/);
  assert.match(markup, /name="desiredJob"/);
  assert.match(markup, /Diplomas y certificaciones/);
  assert.match(markup, /Características y habilidades blandas/);
  assert.match(markup, /name="maxDistanceKm"/);
  assert.match(markup, /No tengo problema en trasladarme/);
  assert.match(markup, /data-profile-completion/);
  assert.match(markup, /data-profile-preview/);
  assert.match(markup, /data-profile-logout>Cerrar sesión/);
  assert.equal(getProfileCompletion(profile), 100);
  assert.match(buildProfilePreviewMarkup(profile), /PERFIL DE TALENTO/);
});

test("los campos visibles cambian por completo según el tipo de cuenta", () => {
  const profile = createDefaultProfile(user);
  const recruiterMarkup = buildAccountFieldsMarkup({ ...profile, accountType: "recruiter" });
  const companyMarkup = buildAccountFieldsMarkup({ ...profile, accountType: "company" });

  assert.match(recruiterMarkup, /Información de reclutamiento/);
  assert.match(recruiterMarkup, /name="recruitingAreas"/);
  assert.doesNotMatch(recruiterMarkup, /name="desiredJob"/);

  assert.match(companyMarkup, /Perfil de empresa/);
  assert.match(companyMarkup, /name="companyName"/);
  assert.match(companyMarkup, /name="remoteWork"/);
  assert.doesNotMatch(companyMarkup, /name="desiredJob"/);
});
