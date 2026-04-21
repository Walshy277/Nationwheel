import { Role } from "@prisma/client";

export function userHasAnyRole(
  user: { role: Role; roles?: Role[] | null } | null | undefined,
  allowedRoles: Role[],
) {
  if (!user) return false;
  const userRoles = new Set([user.role, ...(user.roles ?? [])]);
  return allowedRoles.some((role) => userRoles.has(role));
}

export function canModerateForums(
  user: { role: Role; roles?: Role[] | null } | null | undefined,
) {
  return userHasAnyRole(user, [Role.LORE, Role.ADMIN, Role.OWNER]);
}
