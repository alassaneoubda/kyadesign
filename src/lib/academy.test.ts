import assert from "node:assert/strict";
import test from "node:test";
import { buildAcademyMessage, buildContactMessage, selectionState, whatsappHref } from "./academy";
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

test("should_appendText_when_whatsappMessageLinkProvided", () => {
  const href = whatsappHref("https://wa.me/message/BJI52IVEFBN3O1", "Bonjour Yohann");
  assert.equal(href.startsWith("https://wa.me/message/BJI52IVEFBN3O1"), true);
  assert.match(href, /text=Bonjour(\+|%20)Yohann/);
});

test("should_includeBriefFields_when_buildingContactMessage", () => {
  const message = buildContactMessage({
    name: "Koné Abdoul",
    email: "abdoul@example.com",
    phone: "+225 01 02 03 04 05",
    projectType: "Mockups",
    budget: "5M+ FCFA",
    delay: "3 semaines",
    message: "Je veux des mockups pour ma marque de vêtement de luxe.",
  });
  assert.match(message, /^NOUVELLE COMMANDE/);
  assert.match(message, /Bonjour KYA DESIGN/);
  assert.match(message, /Je suis Koné Abdoul/);
  assert.match(message, /👉 Mockups/);
  assert.match(message, /5M\+ FCFA/);
  assert.match(message, /3 semaines/);
  assert.match(message, /abdoul@example\.com/);
  assert.match(message, /Voici mon brief :/);
  assert.match(message, /marque de vêtement de luxe/);
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
