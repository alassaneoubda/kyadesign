import assert from "node:assert/strict";
import test from "node:test";
import { sessionMatchesCredentials } from "./admin-session-rules";
import { adminAccountSchema } from "./validators";

const ENV_CREDENTIALS = { email: "yohann@example.com", version: 0 };
const DB_CREDENTIALS = { email: "nouveau@example.com", version: 2 };

// ── Validité des sessions ─────────────────────────────────────────

test("should_keepSession_when_legacyTokenAndEnvCredentials", () => {
  assert.equal(sessionMatchesCredentials("yohann@example.com", undefined, ENV_CREDENTIALS), true);
});

test("should_rejectLegacyToken_when_credentialsChangedInBackOffice", () => {
  assert.equal(sessionMatchesCredentials("yohann@example.com", undefined, DB_CREDENTIALS), false);
});

test("should_rejectSession_when_tokenVersionIsOutdated", () => {
  assert.equal(sessionMatchesCredentials("nouveau@example.com", "1", DB_CREDENTIALS), false);
});

test("should_acceptSession_when_emailAndVersionMatch", () => {
  assert.equal(sessionMatchesCredentials("Nouveau@Example.com", "2", DB_CREDENTIALS), true);
});

test("should_rejectSession_when_noCredentialsConfigured", () => {
  assert.equal(sessionMatchesCredentials("yohann@example.com", "0", null), false);
});

// ── Validation du formulaire ──────────────────────────────────────

const base = {
  currentPassword: "ancien-mot-de-passe",
  email: "  Nouveau@Example.com ",
  newPassword: "",
  confirmPassword: "",
};

test("should_normalizeEmail_when_onlyEmailChanges", () => {
  const parsed = adminAccountSchema.safeParse(base);
  assert.equal(parsed.success, true);
  assert.equal(parsed.success && parsed.data.email, "nouveau@example.com");
});

test("should_rejectForm_when_currentPasswordMissing", () => {
  assert.equal(adminAccountSchema.safeParse({ ...base, currentPassword: "" }).success, false);
});

test("should_rejectPassword_when_shorterThan12", () => {
  const parsed = adminAccountSchema.safeParse({ ...base, newPassword: "court123", confirmPassword: "court123" });
  assert.equal(parsed.success, false);
});

test("should_rejectPassword_when_confirmationDiffers", () => {
  const parsed = adminAccountSchema.safeParse({
    ...base,
    newPassword: "un-mot-de-passe-solide",
    confirmPassword: "un-autre-mot-de-passe",
  });
  assert.equal(parsed.success, false);
});

test("should_rejectPassword_when_over72Bytes", () => {
  const long = "é".repeat(40);
  assert.equal(adminAccountSchema.safeParse({ ...base, newPassword: long, confirmPassword: long }).success, false);
});

test("should_acceptPassword_when_validAndConfirmed", () => {
  const parsed = adminAccountSchema.safeParse({
    ...base,
    newPassword: "un-mot-de-passe-solide",
    confirmPassword: "un-mot-de-passe-solide",
  });
  assert.equal(parsed.success, true);
});
