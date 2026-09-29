/**
 * Tests du journal : niveau des incidents rattrapés et absence de détail technique sensible.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { logError, logWarn } from "./log";

function capture(method: "warn" | "error", run: () => string): { line: Record<string, string>; traceId: string } {
  const original = console[method];
  let output = "";
  console[method] = (text: string) => {
    output = text;
  };
  try {
    const traceId = run();
    return { line: JSON.parse(output), traceId };
  } finally {
    console[method] = original;
  }
}

test("should_logAtWarnLevel_when_retryRecovered", () => {
  const { line, traceId } = capture("warn", () => logWarn("home.load.retry1", new Error("connection timeout")));
  assert.equal(line.level, "warn");
  assert.equal(line.action, "home.load.retry1");
  assert.equal(line.message, "connection timeout");
  assert.equal(line.traceId, traceId);
});

test("should_logAtErrorLevel_when_failureNotRecovered", () => {
  const { line } = capture("error", () => logError("home.load", new Error("down")));
  assert.equal(line.level, "error");
});

test("should_hideDetails_when_errorIsNotAnErrorInstance", () => {
  const { line } = capture("warn", () => logWarn("x", { password: "secret" }));
  assert.equal(line.message, "Erreur inconnue");
  assert.ok(!JSON.stringify(line).includes("secret"));
});
