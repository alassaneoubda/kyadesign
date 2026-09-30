/**
 * Tests des reçus d'envoi d'image signés (sécurité : falsification, URL arbitraire, expiration).
 * Clé de test synthétique — jamais la clé réelle.
 * Auteur : Kya Design — 2026-09-30 — v1
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readUploadReceipts, RECEIPT_TTL_MS, signUploadReceipt, verifyUploadReceipt } from "./upload-receipt";

const SECRET = "cle-de-test-synthetique-0123456789abcdef";
const NOW = 1_780_000_000_000;
const SRC = "/api/uploads/creations/0f8fad5b-d9cb-469f-a165-70867728950e.webp";

function srcNumber(n: number): string {
  return `/api/uploads/creations/00000000-0000-4000-8000-${String(n).padStart(12, "0")}.webp`;
}

function batch(count: number, bytes: number, withCover = true): string {
  const receipts = Array.from({ length: count }, (_, i) => signUploadReceipt(srcNumber(i), bytes, SECRET, NOW));
  return JSON.stringify(withCover ? { cover: receipts[0], gallery: receipts.slice(1) } : { cover: null, gallery: receipts });
}

test("should_acceptReceipt_when_signedByServer", () => {
  const receipt = signUploadReceipt(SRC, 250_000, SECRET, NOW);
  assert.deepEqual(verifyUploadReceipt(receipt, SECRET, NOW + 1000), receipt);
});

test("should_rejectReceipt_when_bytesTampered", () => {
  const receipt = signUploadReceipt(SRC, 3_900_000, SECRET, NOW);
  assert.equal(verifyUploadReceipt({ ...receipt, bytes: 1_000 }, SECRET, NOW), null);
});

test("should_rejectReceipt_when_srcReplacedByAnotherImage", () => {
  const receipt = signUploadReceipt(SRC, 250_000, SECRET, NOW);
  const other = "/api/uploads/creations/7c9e6679-7425-40de-944b-e07fc1f90ae7.webp";
  assert.equal(verifyUploadReceipt({ ...receipt, src: other }, SECRET, NOW), null);
});

test("should_rejectReceipt_when_srcIsExternalUrl", () => {
  const receipt = signUploadReceipt("https://evil.example/x.webp", 250_000, SECRET, NOW);
  assert.equal(verifyUploadReceipt(receipt, SECRET, NOW), null);
});

test("should_rejectReceipt_when_signedWithAnotherKey", () => {
  const receipt = signUploadReceipt(SRC, 250_000, "autre-cle-synthetique-0123456789abcdef", NOW);
  assert.equal(verifyUploadReceipt(receipt, SECRET, NOW), null);
});

test("should_rejectReceipt_when_expired", () => {
  const receipt = signUploadReceipt(SRC, 250_000, SECRET, NOW);
  assert.equal(verifyUploadReceipt(receipt, SECRET, NOW + RECEIPT_TTL_MS + 1), null);
});

test("should_rejectReceipt_when_malformed", () => {
  assert.equal(verifyUploadReceipt(null, SECRET, NOW), null);
  assert.equal(verifyUploadReceipt({ src: SRC }, SECRET, NOW), null);
  assert.equal(verifyUploadReceipt("'; DROP TABLE \"Project\"; --", SECRET, NOW), null);
});

test("should_rejectReceipt_when_bytesOverPerImageLimit", () => {
  const receipt = signUploadReceipt(SRC, 5 * 1024 * 1024, SECRET, NOW);
  assert.equal(verifyUploadReceipt(receipt, SECRET, NOW), null);
});

test("should_acceptBatch_when_hundredImagesWithin25MB", () => {
  const result = readUploadReceipts(batch(100, 250_000), SECRET, NOW);
  assert.ok(result.ok);
  assert.equal(result.cover, srcNumber(0));
  assert.equal(result.gallery.length, 99);
  assert.equal(result.gallery[98], srcNumber(99));
});

test("should_acceptBatch_when_noImages", () => {
  assert.deepEqual(readUploadReceipts(JSON.stringify({ cover: null, gallery: [] }), SECRET, NOW), {
    ok: true,
    cover: null,
    gallery: [],
  });
});

test("should_rejectBatch_when_moreThanHundredImages", () => {
  const result = readUploadReceipts(batch(101, 10_000), SECRET, NOW);
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.code === "limits" && result.check.code, "count");
  assert.deepEqual(readUploadReceipts(batch(101, 10_000, false), SECRET, NOW), { ok: false, code: "invalid" });
});

test("should_rejectBatch_when_totalOver25MB", () => {
  const result = readUploadReceipts(batch(7, 3_900_000), SECRET, NOW);
  assert.equal(!result.ok && result.code === "limits" && result.check.code, "total");
});

test("should_rejectBatch_when_sameImageSentTwice", () => {
  const receipt = signUploadReceipt(SRC, 250_000, SECRET, NOW);
  const raw = JSON.stringify({ cover: receipt, gallery: [receipt] });
  assert.deepEqual(readUploadReceipts(raw, SECRET, NOW), { ok: false, code: "duplicate" });
});

test("should_rejectBatch_when_oneReceiptTampered", () => {
  const good = signUploadReceipt(SRC, 250_000, SECRET, NOW);
  const forged = { ...signUploadReceipt(srcNumber(1), 250_000, SECRET, NOW), bytes: 10 };
  const raw = JSON.stringify({ cover: good, gallery: [forged] });
  assert.deepEqual(readUploadReceipts(raw, SECRET, NOW), { ok: false, code: "invalid" });
});

test("should_rejectBatch_when_payloadNotJson", () => {
  assert.deepEqual(readUploadReceipts("{pas du json", SECRET, NOW), { ok: false, code: "invalid" });
  assert.deepEqual(readUploadReceipts(JSON.stringify({ gallery: "x" }), SECRET, NOW), { ok: false, code: "invalid" });
});
