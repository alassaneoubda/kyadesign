/**
 * Tests de la préparation des images avant envoi (limite de 4,5 Mo de l'hébergeur).
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import assert from "node:assert/strict";
import test from "node:test";
import { fitWithin, isServerFormat, KEEP_UNDER_BYTES, needsPreparation, renamedFor } from "./image-prep";

test("should_shrinkLongestEdge_when_photoIsLarge", () => {
  assert.deepEqual(fitWithin(6000, 4000, 1800), { width: 1800, height: 1200 });
  assert.deepEqual(fitWithin(3000, 4500, 1800), { width: 1200, height: 1800 });
});

test("should_keepSize_when_imageAlreadySmall", () => {
  assert.deepEqual(fitWithin(1200, 800, 1800), { width: 1200, height: 800 });
  assert.deepEqual(fitWithin(0, 0, 1800), { width: 0, height: 0 });
});

test("should_renameWithProducedFormat_when_converted", () => {
  assert.equal(renamedFor("IMG_1234.HEIC", "image/webp"), "IMG_1234.webp");
  assert.equal(renamedFor("photo.jfif", "image/jpeg"), "photo.jpg");
  assert.equal(renamedFor("logo.png", "image/png"), "logo.png");
  assert.equal(renamedFor("sans-extension", "image/webp"), "sans-extension.webp");
  assert.equal(renamedFor(".webp", "image/webp"), "image.webp");
});

test("should_acceptServerFormats_when_extensionAndTypeMatch", () => {
  assert.equal(isServerFormat({ name: "a.JPG", type: "image/jpeg" }), true);
  assert.equal(isServerFormat({ name: "a.tiff", type: "" }), true);
});

test("should_rejectServerFormat_when_heicJfifOrAvif", () => {
  assert.equal(isServerFormat({ name: "IMG.HEIC", type: "image/heic" }), false);
  assert.equal(isServerFormat({ name: "photo.jfif", type: "image/jpeg" }), false);
  assert.equal(isServerFormat({ name: "a.avif", type: "image/avif" }), false);
});

test("should_prepare_when_photoIsHeavyOrWrongFormat", () => {
  assert.equal(needsPreparation({ name: "a.jpg", type: "image/jpeg", size: 6_000_000 }), true);
  assert.equal(needsPreparation({ name: "a.heic", type: "image/heic", size: 800_000 }), true);
});

test("should_sendAsIs_when_lightImageInAcceptedFormat", () => {
  assert.equal(needsPreparation({ name: "a.png", type: "image/png", size: KEEP_UNDER_BYTES }), false);
});

test("should_prepare_when_mediumJpegWouldWasteSubmissionBudget", () => {
  assert.equal(needsPreparation({ name: "a.jpg", type: "image/jpeg", size: 1_200_000 }), true);
});

test("should_matchServerStoredSize_when_defaultEdgeUsed", () => {
  assert.deepEqual(fitWithin(4000, 3000), { width: 1200, height: 900 });
});
