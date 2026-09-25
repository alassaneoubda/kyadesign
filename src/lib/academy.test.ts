import assert from "node:assert/strict";
import test from "node:test";
import { buildAcademyMessage, selectionState, whatsappHref } from "./academy";
import { isAccessCode, normalizeCode } from "./codes";

test("should_includeModeAndTitle_when_formationChosen", () => {
  const message = buildAcademyMessage({
    kind: "formation",
    title: "Photoshop",
    mode: "En ligne",
  });
  assert.match(message, /formation Photoshop/);
  assert.match(message, /En ligne/);
  assert.match(message, /modalités de formation/);
});

test("should_includePackName_when_packChosen", () => {
  const message = buildAcademyMessage({
    kind: "pack",
    title: "Pack Créatif",
    mode: "Présentiel",
  });
  assert.match(message, /le Pack Créatif/);
  assert.match(message, /Présentiel/);
  assert.match(message, /disponibilités/);
});

test("should_encodeMessage_when_buildingWhatsappLink", () => {
  const href = whatsappHref("+225 05 64 36 95 54", "Bonjour Yohann");
  assert.equal(href.startsWith("https://wa.me/2250564369554?text="), true);
  assert.match(href, /Bonjour%20Yohann/);
});

test("should_blockSelection_when_limitReached", () => {
  assert.equal(selectionState(10, 10).canAdd, false);
  assert.equal(selectionState(9, 10).canAdd, true);
  assert.equal(selectionState(9, 10).label, "9 / 10");
});

test("should_normalizeCode_when_guestTypesSpaces", () => {
  assert.equal(normalizeCode("  kya-8f42-9k "), "KYA-8F42-9K");
  assert.equal(isAccessCode("KYA-8F42-9K"), true);
  assert.equal(isAccessCode("001"), false);
});
