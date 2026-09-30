/**
 * Tests des plafonds d'envoi d'une réalisation (100 images, 25 Mo au total, 4 Mo par image).
 * Auteur : Kya Design — 2026-09-30 — v1
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  checkSubmission,
  formatMegabytes,
  MAX_IMAGE_REQUEST_BYTES,
  MAX_IMAGES_PER_SUBMISSION,
  MAX_SUBMISSION_BYTES,
  submissionErrorMessage,
} from "./upload-limits";

const KB = 1024;

test("should_accept_when_noImageSelected", () => {
  assert.deepEqual(checkSubmission([]), { ok: true, count: 0, bytes: 0 });
});

test("should_accept_when_exactly100ImagesUnder25MB", () => {
  const sizes = Array.from({ length: MAX_IMAGES_PER_SUBMISSION }, () => 250 * KB);
  const result = checkSubmission(sizes);
  assert.equal(result.ok, true);
  assert.equal(result.count, 100);
});

test("should_refuseCount_when_101Images", () => {
  const result = checkSubmission(Array.from({ length: 101 }, () => 10 * KB));
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.code, "count");
});

test("should_accept_when_totalExactly25MB", () => {
  const sizes = Array.from({ length: 25 }, () => 1024 * KB);
  assert.equal(checkSubmission(sizes).ok, true);
  assert.equal(checkSubmission(sizes).bytes, MAX_SUBMISSION_BYTES);
});

test("should_refuseTotal_when_oneByteOver25MB", () => {
  const sizes = [...Array.from({ length: 25 }, () => 1024 * KB), 1];
  const result = checkSubmission(sizes);
  assert.equal(!result.ok && result.code, "total");
});

test("should_refuseFile_when_singleImageOver4MB", () => {
  const result = checkSubmission([MAX_IMAGE_REQUEST_BYTES + 1]);
  assert.equal(!result.ok && result.code, "file");
});

test("should_explainHowManyToRemove_when_countExceeded", () => {
  const result = checkSubmission(Array.from({ length: 104 }, () => KB));
  assert.ok(!result.ok);
  assert.match(submissionErrorMessage(result), /104 images.*100 maximum.*Retire-en 4/);
});

test("should_formatFrenchMegabytes_when_displayingWeight", () => {
  assert.equal(formatMegabytes(MAX_SUBMISSION_BYTES), "25,0 Mo");
  assert.equal(formatMegabytes(4.35 * 1024 * KB), "4,3 Mo");
});
