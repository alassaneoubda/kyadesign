/**
 * Tests des règles de la vitrine : champs facultatifs, e-mail contact facultatif,
 * réseaux sociaux, témoignages et affichage adaptatif.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import assert from "node:assert/strict";
import test from "node:test";
import { buildContactMessage } from "./academy";
import {
  factIconFor,
  initials,
  joinDefined,
  projectSteps,
  roleBadgeLines,
  skillIconFor,
  slugify,
  splitDisplayName,
  studyMedia,
} from "./showcase";
import { isSafeExternalUrl, socialDisplayName } from "./social";
import {
  contactSchema,
  projectSchema,
  socialLinkSchema,
  testimonialSchema,
  visibilitySchema,
} from "./validators";

// ─── Contact : e-mail facultatif ────────────────────────────────────────────

const contactBase = { name: "Awa Koné", phone: "", projectType: "", budget: "", delay: "", message: "Bonjour, un logo." };

test("should_acceptContact_when_emailEmpty", () => {
  const parsed = contactSchema.safeParse({ ...contactBase, email: "" });
  assert.equal(parsed.success, true);
  assert.equal(parsed.success && parsed.data.email, "");
});

test("should_acceptContact_when_emailAbsent", () => {
  const parsed = contactSchema.safeParse({ ...contactBase, email: null });
  assert.equal(parsed.success, true);
  assert.equal(parsed.success && parsed.data.email, "");
});

test("should_rejectContact_when_emailMalformed", () => {
  const parsed = contactSchema.safeParse({ ...contactBase, email: "pas-un-email" });
  assert.equal(parsed.success, false);
});

test("should_keepEmail_when_emailValid", () => {
  const parsed = contactSchema.safeParse({ ...contactBase, email: "  awa@example.com " });
  assert.equal(parsed.success && parsed.data.email, "awa@example.com");
});

test("should_stillRequireNameAndMessage_when_emailOptional", () => {
  assert.equal(contactSchema.safeParse({ ...contactBase, email: "", name: "" }).success, false);
  assert.equal(contactSchema.safeParse({ ...contactBase, email: "", message: "" }).success, false);
});

test("should_printNonRenseigne_when_whatsappBriefWithoutEmail", () => {
  const message = buildContactMessage({ ...contactBase, email: "" });
  assert.match(message, /Email : Non renseigné/);
});

// ─── Réalisations : champs facultatifs ──────────────────────────────────────

test("should_acceptProject_when_allContentFieldsEmpty", () => {
  const parsed = projectSchema.safeParse({ featured: false, visible: true });
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  assert.equal(parsed.data.title, "");
  assert.equal(parsed.data.probleme, "");
  assert.equal(parsed.data.sortOrder, 0);
});

test("should_acceptProject_when_onlyTitleProvided", () => {
  const parsed = projectSchema.safeParse({ title: "Affiche festival", featured: false, visible: true });
  assert.equal(parsed.success && parsed.data.title, "Affiche festival");
});

test("should_rejectProject_when_identifierHasSpaces", () => {
  const parsed = projectSchema.safeParse({ id: "Mon Projet", featured: false, visible: true });
  assert.equal(parsed.success, false);
});

test("should_rejectProject_when_titleTooLong", () => {
  const parsed = projectSchema.safeParse({ title: "x".repeat(121), featured: false, visible: true });
  assert.equal(parsed.success, false);
});

test("should_slugifyTitle_when_accentsAndSpaces", () => {
  assert.equal(slugify("  Mariage à Abidjan — Été 2026 "), "mariage-a-abidjan-ete-2026");
  assert.equal(slugify("!!!"), "");
});

test("should_returnOnlyWrittenSteps_when_someStepsEmpty", () => {
  const steps = projectSteps({ probleme: "Pas de visibilité", concept: "  ", creation: "", resultat: "+40 %" });
  assert.deepEqual(steps.map((step) => step.title), ["Problème", "Résultat"]);
});

test("should_returnNoStep_when_storyEmpty", () => {
  assert.deepEqual(projectSteps({ probleme: "", concept: "", creation: "", resultat: "" }), []);
});

test("should_useCoverAsHero_when_coverProvided", () => {
  assert.deepEqual(studyMedia({ cover: "/c.webp", gallery: ["/c.webp", "/g1.webp"] }), {
    hero: "/c.webp",
    gallery: ["/g1.webp"],
  });
});

test("should_useFirstGalleryImageAsHero_when_coverMissing", () => {
  assert.deepEqual(studyMedia({ cover: "", gallery: ["/g1.webp", "/g2.webp"] }), {
    hero: "/g1.webp",
    gallery: ["/g2.webp"],
  });
});

test("should_returnNoMedia_when_noCoverAndNoImages", () => {
  assert.deepEqual(studyMedia({ cover: "", gallery: [] }), { hero: "", gallery: [] });
});

test("should_mapSkillIcons_when_knownKeywords", () => {
  assert.equal(skillIconFor("Direction artistique"), "pen");
  assert.equal(skillIconFor("Direction photo"), "camera");
  assert.equal(skillIconFor("Typographie"), "type");
  assert.equal(skillIconFor("Broderie"), "sparkle");
});

test("should_mapFactIcons_when_keywordOrPosition", () => {
  assert.equal(factIconFor("Projets réalisés", 0), "folder");
  assert.equal(factIconFor("Sur-mesure", 0), "users");
  assert.equal(factIconFor("Café bu", 1), "folder");
});

test("should_skipEmptyParts_when_joiningMeta", () => {
  assert.equal(joinDefined(["", "2026", null, undefined, " Paul "]), "2026 · Paul");
  assert.equal(joinDefined(["", null]), "");
});

// ─── Visibilité ─────────────────────────────────────────────────────────────

test("should_acceptVisibilityToggle_when_knownEntity", () => {
  assert.equal(visibilitySchema.safeParse({ entity: "project", id: "abc", visible: false }).success, true);
});

test("should_rejectVisibilityToggle_when_unknownEntity", () => {
  assert.equal(visibilitySchema.safeParse({ entity: "album", id: "abc", visible: false }).success, false);
});

// ─── Réseaux sociaux ────────────────────────────────────────────────────────

const socialBase = { platform: "instagram", label: "", handle: "@kya", visible: true, sortOrder: "" };

test("should_acceptSocialLink_when_httpsUrl", () => {
  const parsed = socialLinkSchema.safeParse({ ...socialBase, url: "https://instagram.com/kya" });
  assert.equal(parsed.success, true);
});

test("should_rejectSocialLink_when_javascriptUrl", () => {
  const parsed = socialLinkSchema.safeParse({ ...socialBase, url: "javascript:alert(1)" });
  assert.equal(parsed.success, false);
});

test("should_rejectSocialLink_when_unknownPlatform", () => {
  const parsed = socialLinkSchema.safeParse({ ...socialBase, platform: "myspace", url: "https://myspace.com/kya" });
  assert.equal(parsed.success, false);
});

test("should_rejectUrl_when_noDomain", () => {
  assert.equal(isSafeExternalUrl("https://localhost"), false);
  assert.equal(isSafeExternalUrl("data:text/html,hi"), false);
});

test("should_usePlatformName_when_labelEmpty", () => {
  assert.equal(socialDisplayName({ platform: "tiktok", label: "" }), "TikTok");
  assert.equal(socialDisplayName({ platform: "tiktok", label: "Kya TikTok" }), "Kya TikTok");
});

// ─── Témoignages ────────────────────────────────────────────────────────────

test("should_acceptTestimonial_when_optionalFieldsAbsent", () => {
  const parsed = testimonialSchema.safeParse({
    name: "Paul Yao",
    role: null,
    company: null,
    quote: "Un travail précis et rapide.",
    visible: true,
    sortOrder: "",
  });
  assert.equal(parsed.success, true);
  assert.equal(parsed.success && parsed.data.company, "");
});

test("should_rejectTestimonial_when_quoteTooShort", () => {
  const parsed = testimonialSchema.safeParse({ name: "Paul", quote: "Top", visible: true, sortOrder: 0 });
  assert.equal(parsed.success, false);
});

// ─── Section « À propos » ───────────────────────────────────────────────────

test("should_splitNameInTwoTones_when_severalWords", () => {
  assert.deepEqual(splitDisplayName("Yohann Armel"), { first: "Yohann", rest: "Armel" });
  assert.deepEqual(splitDisplayName("Yohann"), { first: "Yohann", rest: "" });
});

test("should_buildTwoBadgeLines_when_roleHasAmpersandAndDash", () => {
  assert.deepEqual(roleBadgeLines("Graphiste & Directeur Créatif — KYA Design"), [
    "Graphiste",
    "& Directeur Créatif",
  ]);
  assert.deepEqual(roleBadgeLines(""), []);
});

test("should_returnTwoInitials_when_fullName", () => {
  assert.equal(initials("awa marie koné"), "AM");
  assert.equal(initials(""), "");
});
