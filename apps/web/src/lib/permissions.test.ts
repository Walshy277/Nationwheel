import test from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { canModerateForums, userHasAnyRole } from "@/lib/role-utils";

test("userHasAnyRole checks both primary and secondary roles", () => {
  const user = {
    role: Role.USER,
    roles: [Role.USER, Role.JOURNALIST, Role.LORE],
  };

  assert.equal(userHasAnyRole(user, [Role.ADMIN]), false);
  assert.equal(userHasAnyRole(user, [Role.LORE]), true);
  assert.equal(userHasAnyRole(user, [Role.ADMIN, Role.LORE]), true);
});

test("userHasAnyRole returns false for anonymous users", () => {
  assert.equal(userHasAnyRole(null, [Role.USER]), false);
  assert.equal(userHasAnyRole(undefined, [Role.ADMIN]), false);
});

test("canModerateForums allows lore and higher roles only", () => {
  assert.equal(
    canModerateForums({ role: Role.LORE, roles: [Role.LORE] }),
    true,
  );
  assert.equal(
    canModerateForums({ role: Role.ADMIN, roles: [Role.ADMIN] }),
    true,
  );
  assert.equal(
    canModerateForums({ role: Role.OWNER, roles: [Role.OWNER] }),
    true,
  );
  assert.equal(
    canModerateForums({ role: Role.USER, roles: [Role.USER, Role.LEADER] }),
    false,
  );
});
