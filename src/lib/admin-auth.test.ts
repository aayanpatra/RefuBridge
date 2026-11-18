import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSession,
  isValidAdminSession,
  verifyAdminPassword,
} from "./admin-auth";

const secret = "a".repeat(32);

test("admin session accepts a valid signature until expiration", () => {
  const now = 1_000_000;
  const token = createAdminSession(secret, now);

  assert.equal(isValidAdminSession(token, secret, now), true);
  assert.equal(
    isValidAdminSession(token, secret, now + ADMIN_SESSION_MAX_AGE_SECONDS * 1000),
    false,
  );
});

test("admin session rejects tampering and missing or short secrets", () => {
  const token = createAdminSession(secret);

  assert.equal(isValidAdminSession(`${token}x`, secret), false);
  assert.equal(isValidAdminSession(token, `${secret}x`), false);
  assert.equal(isValidAdminSession(token, undefined), false);
  assert.equal(isValidAdminSession(token, "short"), false);
});

test("admin password verification requires a configured strong password", () => {
  assert.equal(verifyAdminPassword("correct horse battery staple", "correct horse battery staple"), true);
  assert.equal(verifyAdminPassword("wrong password", "correct horse battery staple"), false);
  assert.equal(verifyAdminPassword("password", "password"), false);
  assert.equal(verifyAdminPassword("anything", undefined), false);
});
