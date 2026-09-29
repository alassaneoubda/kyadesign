/**
 * Tests du compteur de visites : jours UTC, filtrage des robots et des pages,
 * contrôle d'origine, séries quotidiennes et tendances.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDailySeries,
  isLikelyBot,
  isSameOrigin,
  isTrackablePath,
  secondsUntilUtcMidnight,
  sumLastDays,
  trendPercent,
  utcDayKey,
} from "./visits";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

test("should_returnUtcDate_when_formattingDayKey", () => {
  assert.equal(utcDayKey(new Date("2026-09-29T23:59:59Z")), "2026-09-29");
  assert.equal(utcDayKey(new Date("2026-09-30T00:00:00Z")), "2026-09-30");
});

test("should_countSecondsToMidnight_when_computingCookieLifetime", () => {
  assert.equal(secondsUntilUtcMidnight(new Date("2026-09-29T23:00:00Z")), 3600);
  assert.equal(secondsUntilUtcMidnight(new Date("2026-09-29T00:00:00Z")), 86_400);
});

test("should_keepAtLeastOneMinute_when_midnightIsImminent", () => {
  assert.equal(secondsUntilUtcMidnight(new Date("2026-09-29T23:59:59Z")), 60);
});

test("should_acceptRealBrowser_when_userAgentIsHuman", () => {
  assert.equal(isLikelyBot(BROWSER_UA), false);
});

test("should_flagBot_when_userAgentIsCrawlerOrMissing", () => {
  assert.equal(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isLikelyBot("WhatsApp/2.23.20.0 A"), true);
  assert.equal(isLikelyBot("curl/8.4.0"), true);
  assert.equal(isLikelyBot("Mozilla/5.0 HeadlessChrome/140.0"), true);
  assert.equal(isLikelyBot(""), true);
  assert.equal(isLikelyBot(null), true);
});

test("should_trackPublicPages_when_pathIsPublic", () => {
  assert.equal(isTrackablePath("/"), true);
  assert.equal(isTrackablePath("/galerie/mariage"), true);
});

test("should_ignorePath_when_adminApiOrInvalid", () => {
  assert.equal(isTrackablePath("/admin"), false);
  assert.equal(isTrackablePath("/admin/projets"), false);
  assert.equal(isTrackablePath("/api/visit"), false);
  assert.equal(isTrackablePath("https://evil.example/"), false);
  assert.equal(isTrackablePath(`/${"a".repeat(300)}`), false);
  assert.equal(isTrackablePath(null), false);
});

test("should_acceptCall_when_originMatchesHost", () => {
  assert.equal(isSameOrigin("https://kyadesign.com", "kyadesign.com"), true);
});

test("should_rejectCall_when_originIsForeignMissingOrInvalid", () => {
  assert.equal(isSameOrigin("https://evil.example", "kyadesign.com"), false);
  assert.equal(isSameOrigin(null, "kyadesign.com"), false);
  assert.equal(isSameOrigin("not a url", "kyadesign.com"), false);
});

test("should_fillMissingDaysWithZero_when_buildingSeries", () => {
  const series = buildDailySeries(
    [{ day: new Date("2026-09-27T00:00:00Z"), views: 5, visitors: 3 }],
    4,
    new Date("2026-09-29T15:00:00Z")
  );
  assert.deepEqual(series, [
    { key: "2026-09-26", views: 0, visitors: 0 },
    { key: "2026-09-27", views: 5, visitors: 3 },
    { key: "2026-09-28", views: 0, visitors: 0 },
    { key: "2026-09-29", views: 0, visitors: 0 },
  ]);
});

test("should_returnEmptySeries_when_daysIsZero", () => {
  assert.deepEqual(buildDailySeries([], 0, new Date("2026-09-29T00:00:00Z")), []);
});

test("should_sumOnlyLastDays_when_totalling", () => {
  const series = [
    { key: "a", views: 10, visitors: 4 },
    { key: "b", views: 2, visitors: 1 },
    { key: "c", views: 3, visitors: 2 },
  ];
  assert.deepEqual(sumLastDays(series, 2), { views: 5, visitors: 3 });
  assert.deepEqual(sumLastDays([], 7), { views: 0, visitors: 0 });
});

test("should_computeSignedTrend_when_previousPeriodHasVisits", () => {
  assert.equal(trendPercent(15, 10), 50);
  assert.equal(trendPercent(5, 10), -50);
  assert.equal(trendPercent(10, 10), 0);
});

test("should_returnNull_when_previousPeriodIsEmpty", () => {
  assert.equal(trendPercent(8, 0), null);
});
