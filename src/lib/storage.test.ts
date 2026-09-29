/**
 * Tests de non-régression de l'enregistrement des visuels de réalisation (stockage disque, jamais R2).
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { after, before, test } from "node:test";
import sharp from "sharp";
import { ImageValidationError, savePublicImage } from "./storage";

const FOLDER = "testsuite";
const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads", FOLDER);

before(() => {
  for (const key of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]) delete process.env[key];
});

after(() => rm(UPLOAD_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }));

async function photo(width: number, height: number, format: "jpeg" | "webp"): Promise<Buffer> {
  const noise = Buffer.alloc(width * height * 3);
  for (let i = 0; i < noise.length; i += 1) noise[i] = (i * 7919) % 251;
  const image = sharp(noise, { raw: { width, height, channels: 3 } });
  return format === "jpeg" ? image.jpeg({ quality: 95 }).toBuffer() : image.webp({ quality: 85 }).toBuffer();
}

function expectCode(code: string) {
  return (error: unknown) => error instanceof ImageValidationError && error.code === code;
}

test("should_saveCompressedWebp_when_largePhotoSent", async () => {
  const bytes = await photo(4000, 3000, "jpeg");
  const url = await savePublicImage(new File([new Uint8Array(bytes)], "IMG_0001.JPG"), FOLDER, { compress: true });
  assert.match(url ?? "", /^\/api\/uploads\/testsuite\/[0-9a-f-]+\.webp$/);
  const saved = await readFile(path.join(UPLOAD_DIR, path.basename(url!)));
  assert.equal((await sharp(saved).metadata()).width, 1200);
  assert.ok(saved.length < bytes.length);
});

test("should_acceptBrowserPreparedWebp_when_imageInputConvertedIt", async () => {
  const bytes = await photo(1800, 1200, "webp");
  const url = await savePublicImage(new File([new Uint8Array(bytes)], "IMG_0002.webp"), FOLDER, { compress: true });
  assert.ok(url?.endsWith(".webp"));
});

test("should_throwUnreadable_when_fileIsCorrupted", async () => {
  const garbage = new File([new Uint8Array(2048).fill(42)], "photo.jpg");
  await assert.rejects(savePublicImage(garbage, FOLDER, { compress: true }), expectCode("unreadable"));
});

test("should_throwFormat_when_extensionNotSupported", async () => {
  const heic = new File([new Uint8Array(2048)], "IMG_0003.HEIC");
  await assert.rejects(savePublicImage(heic, FOLDER, { compress: true }), expectCode("format"));
});

test("should_throwSize_when_fileOver25MB", async () => {
  const huge = new File([new Uint8Array(25 * 1024 * 1024 + 1)], "big.jpg");
  await assert.rejects(savePublicImage(huge, FOLDER, { compress: true }), expectCode("size"));
});

test("should_returnNull_when_noFileChosen", async () => {
  assert.equal(await savePublicImage(new File([], ""), FOLDER, { compress: true }), null);
});
