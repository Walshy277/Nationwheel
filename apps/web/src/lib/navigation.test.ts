import test from "node:test";
import assert from "node:assert/strict";
import { isActivePath, normalizeNavHref } from "@/lib/navigation";

test("normalizeNavHref strips hash fragments", () => {
  assert.equal(normalizeNavHref("/nations#compare"), "/nations");
  assert.equal(normalizeNavHref("/forums"), "/forums");
});

test("isActivePath matches exact routes", () => {
  assert.equal(isActivePath("/forums", "/forums"), true);
  assert.equal(isActivePath("/dashboard", "/dashboard"), true);
});

test("isActivePath matches nested routes", () => {
  assert.equal(isActivePath("/dashboard/notifications", "/dashboard"), true);
  assert.equal(isActivePath("/forums/thread-1", "/forums"), true);
});

test("isActivePath does not overmatch unrelated routes", () => {
  assert.equal(isActivePath("/forum", "/forums"), false);
  assert.equal(isActivePath("/dashboarding", "/dashboard"), false);
});
