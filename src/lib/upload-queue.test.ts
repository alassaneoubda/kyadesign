/**
 * Tests de la file d'envoi des images (parallélisme, ordre, cache, erreurs partielles).
 * Auteur : Kya Design — 2026-09-30 — v1
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runUploads, UploadBatchError } from "./upload-queue";

type Item = { name: string };
const items = (count: number): Item[] => Array.from({ length: count }, (_, index) => ({ name: `img-${index}` }));
const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

test("should_returnResultsInOrder_when_allUploadsSucceed", async () => {
  const list = items(10);
  const results = await runUploads(list, async (item) => (await tick(), item.name.toUpperCase()), { cache: new WeakMap() });
  assert.deepEqual(results, list.map((item) => item.name.toUpperCase()));
});

test("should_neverExceedWorkerCount_when_uploading100Images", async () => {
  let active = 0;
  let peak = 0;
  await runUploads(items(100), async () => {
    active += 1;
    peak = Math.max(peak, active);
    await tick();
    active -= 1;
    return 1;
  }, { cache: new WeakMap(), workers: 4 });
  assert.equal(peak, 4);
});

test("should_reportProgress_when_eachUploadEnds", async () => {
  const seen: number[] = [];
  await runUploads(items(3), async () => 1, { cache: new WeakMap(), onProgress: (done) => seen.push(done) });
  assert.deepEqual(seen, [0, 1, 2, 3]);
});

test("should_throwWithFailedNames_when_someUploadsFail", async () => {
  const list = items(5);
  await assert.rejects(
    runUploads(list, async (item) => {
      if (item.name === "img-1" || item.name === "img-3") throw new Error(`${item.name} : refusée`);
      return item.name;
    }, { cache: new WeakMap() }),
    (error: unknown) => error instanceof UploadBatchError && error.failures.length === 2 && /2 images/.test(error.message)
  );
});

test("should_notResendAcceptedImages_when_retryingAfterPartialFailure", async () => {
  const list = items(4);
  const cache = new WeakMap<Item, string>();
  const sent: string[] = [];
  let failOnce = true;
  const send = async (item: Item) => {
    sent.push(item.name);
    if (item.name === "img-2" && failOnce) {
      failOnce = false;
      throw new Error("img-2 : connexion interrompue");
    }
    return item.name;
  };
  await assert.rejects(runUploads(list, send, { cache }));
  sent.length = 0;
  const results = await runUploads(list, send, { cache });
  assert.deepEqual(sent, ["img-2"]);
  assert.deepEqual(results, ["img-0", "img-1", "img-2", "img-3"]);
});

test("should_returnEmpty_when_noImage", async () => {
  assert.deepEqual(await runUploads([], async () => 1, { cache: new WeakMap() }), []);
});
