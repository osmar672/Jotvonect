import assert from "node:assert/strict";
import test from "node:test";
import { createResumeService } from "../src/js/resumes/resume-service.js";

function storage() { const values = new Map(); return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) }; }

test("guarda varios currículums y permite elegir uno al aplicar", async () => {
  const service = createResumeService({ id: 4 }, storage());
  await service.addFiles([{ name: "frontend.pdf", type: "application/pdf", size: 1000 }, { name: "liderazgo.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 2000 }]);
  assert.equal(service.list().length, 2);
  const selected = service.list()[1];
  const application = service.apply({ id: 8, title: "Frontend" }, selected.id);
  assert.equal(application.resumeName, selected.name);
  assert.equal(application.vacancyId, 8);
});
