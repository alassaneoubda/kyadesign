/**
 * Tests des avis visiteurs : détection des robots, refus des liens, validation du formulaire.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import assert from "node:assert/strict";
import test from "node:test";
import { containsLink, isLikelySpamSubmission, MAX_FILL_MS, MIN_FILL_MS } from "./reviews";
import { visitorReviewSchema } from "./validators";

const NOW = Date.UTC(2026, 8, 29, 15, 0, 0);

test("should_acceptSubmission_when_humanTookSeveralSeconds", () => {
  assert.equal(isLikelySpamSubmission("", NOW - 45_000, NOW), false);
});

test("should_flagSpam_when_honeypotIsFilled", () => {
  assert.equal(isLikelySpamSubmission("http://spam.example", NOW - 45_000, NOW), true);
});

test("should_flagSpam_when_submittedFasterThanMinimum", () => {
  assert.equal(isLikelySpamSubmission("", NOW - (MIN_FILL_MS - 1), NOW), true);
  assert.equal(isLikelySpamSubmission("", NOW - MIN_FILL_MS, NOW), false);
});

test("should_flagSpam_when_timestampMissingFutureOrTooOld", () => {
  assert.equal(isLikelySpamSubmission("", Number.NaN, NOW), true);
  assert.equal(isLikelySpamSubmission("", 0, NOW), true);
  assert.equal(isLikelySpamSubmission("", NOW + 60_000, NOW), true);
  assert.equal(isLikelySpamSubmission("", NOW - MAX_FILL_MS - 1, NOW), true);
});

test("should_detectLink_when_textContainsUrlOrDomain", () => {
  assert.equal(containsLink("Visitez https://promo.example"), true);
  assert.equal(containsLink("voir www.cheap-offers.net"), true);
  assert.equal(containsLink("gagnez sur casino-win.xyz"), true);
});

test("should_notDetectLink_when_textIsNormalReview", () => {
  assert.equal(containsLink("Travail soigné, délais respectés. Je recommande vivement Kya Design !"), false);
  assert.equal(containsLink("Merci pour le logo, c'est top."), false);
});

test("should_acceptReview_when_optionalFieldsAbsent", () => {
  const parsed = visitorReviewSchema.safeParse({
    name: "  Awa  ",
    role: null,
    company: null,
    quote: "Une identité visuelle superbe et un vrai sens de l'écoute.",
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.name, "Awa");
    assert.equal(parsed.data.role, "");
    assert.equal(parsed.data.company, "");
  }
});

test("should_rejectReview_when_quoteTooShortOrNameMissing", () => {
  assert.equal(visitorReviewSchema.safeParse({ name: "Awa", quote: "Top !" }).success, false);
  assert.equal(visitorReviewSchema.safeParse({ name: "", quote: "Une très belle collaboration, merci." }).success, false);
});

test("should_rejectReview_when_quoteTooLong", () => {
  assert.equal(visitorReviewSchema.safeParse({ name: "Awa", quote: "a".repeat(801) }).success, false);
});
