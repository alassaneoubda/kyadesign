import assert from "node:assert/strict";
import test from "node:test";
import { getSiteUrl, isLocalUrl } from "./site-url";

function withSiteUrl(value: string | undefined, run: () => void) {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = value;
  try {
    run();
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
}

test("should_addHttps_when_protocolMissing", () => {
  withSiteUrl("kyadesign.vercel.app", () => {
    assert.equal(getSiteUrl(), "https://kyadesign.vercel.app");
  });
});

test("should_stripTrailingSlash_when_fullUrlProvided", () => {
  withSiteUrl("https://kyadesign.vercel.app/", () => {
    assert.equal(getSiteUrl(), "https://kyadesign.vercel.app");
  });
});

test("should_fallbackToLocalhost_when_empty", () => {
  withSiteUrl(undefined, () => {
    assert.equal(getSiteUrl(), "http://localhost:3000");
  });
});

test("should_fallbackToLocalhost_when_invalid", () => {
  withSiteUrl("pas une url !!", () => {
    assert.equal(getSiteUrl(), "http://localhost:3000");
  });
});

test("should_flagLocalUrl_when_localhostOrLoopback", () => {
  assert.equal(isLocalUrl("http://localhost:3000"), true);
  assert.equal(isLocalUrl("http://127.0.0.1:3000"), true);
});

test("should_notFlagLocalUrl_when_realDomainOrLanIp", () => {
  assert.equal(isLocalUrl("https://kyadesign.vercel.app"), false);
  assert.equal(isLocalUrl("http://192.168.9.231:3000"), false);
});
