/**
 * Tests de la nouvelle tentative automatique (coupures passagères de la base).
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import assert from "node:assert/strict";
import test from "node:test";
import { withRetry } from "./retry";

const noSleep = async () => {};

test("should_returnResult_when_firstAttemptSucceeds", async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    calls += 1;
    return "ok";
  }, { sleep: noSleep });
  assert.equal(result, "ok");
  assert.equal(calls, 1);
});

test("should_succeed_when_transientFailureThenSuccess", async () => {
  let calls = 0;
  const retried: number[] = [];
  const result = await withRetry(
    async () => {
      calls += 1;
      if (calls < 3) throw new Error("Connection terminated due to connection timeout");
      return 42;
    },
    { sleep: noSleep, onRetry: (_error, attempt) => retried.push(attempt) }
  );
  assert.equal(result, 42);
  assert.equal(calls, 3);
  assert.deepEqual(retried, [1, 2]);
});

test("should_throwLastError_when_allAttemptsFail", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(async () => {
      calls += 1;
      throw new Error(`échec ${calls}`);
    }, { sleep: noSleep }),
    /échec 3/
  );
  assert.equal(calls, 3);
});

test("should_waitWithExponentialBackoff_when_retrying", async () => {
  const waits: number[] = [];
  await assert.rejects(
    withRetry(async () => {
      throw new Error("down");
    }, { baseDelayMs: 100, sleep: async (ms) => void waits.push(ms) })
  );
  assert.deepEqual(waits, [100, 200]);
});

test("should_capAttemptsAtThree_when_moreRequested", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(async () => {
      calls += 1;
      throw new Error("down");
    }, { attempts: 10, sleep: noSleep })
  );
  assert.equal(calls, 3);
});
