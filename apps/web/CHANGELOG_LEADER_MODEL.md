# Leader / Nation Control Refactor

## Core rules implemented
- Users are read-only by default via `Role.USER`.
- A user becomes `Role.LEADER` when lore/admin/owner links them to a nation.
- The linked account controls the nation through `Nation.leaderUserId`.
- `Nation.leaderName` is now a fictional public-facing leader name and is separate from the linked account name.
- The linked account can change `leaderName`, wiki content, and flag for the nation they control.
- Lore/Admin/Owner can edit canon nation stats and public lore pages.

## Exact file changes
- `prisma/schema.prisma`
  - added roles: `USER`, `OWNER`
  - default user role is now `USER`
  - added `Nation.leaderName`
  - added revision type `LEADER_NAME`
  - removed the user->nation relationship from the schema model
- `prisma/seed.ts`
  - updated seed users and sample nation controller linkage
  - seeds `leaderName` separately from account name
- `src/types/next-auth.d.ts`
  - removed `nationId` from session/jwt typing
- `src/lib/auth.ts`
  - session/jwt no longer carry `nationId`
  - default role is now `USER`
  - added `OWNER` resolution by Discord ID env var support
- `src/lib/permissions.ts`
  - wiki edit access now checks `Nation.leaderUserId === user.id` for `LEADER`
  - `LORE`, `ADMIN`, `OWNER` always bypass wiki restriction
- `src/lib/validation.ts`
  - added `leaderNameSchema`
- `src/lib/nations.ts`
  - database is the nation source of truth
  - returns `nation.leaderName` instead of linked account name
- `src/lib/control-panels.ts`
  - removed LoreCP members link from default nav
- `src/app/actions.ts`
  - added `updateLeaderNameAction`
  - `assignUserNationAction` now links controller account to nation and promotes user to `LEADER`
  - removed user-side nation assignment writes
  - staff-only stat editing now includes `OWNER`
- `src/app/dashboard/wiki/page.tsx`
  - now finds the nation by `leaderUserId`
  - shows read-only state until linked
  - adds leader-name editor for linked leaders
- `src/app/admincp/users/page.tsx`
  - removed direct nation assignment UI
  - shows which nations a user controls
- `src/app/lorecp/members/page.tsx`
  - repurposed to nation-controller linking view
- `src/app/lorecp/page.tsx`
  - removed member-link card from dashboard
- `src/app/lorecp/nations/[id]/page.tsx`
  - removed old members nav link and broadened access to include `OWNER`
- `src/app/lorecp/pages/[key]/page.tsx`
  - removed old members nav link and broadened access to include `OWNER`
- `src/app/admincp/nations/page.tsx`
  - updated labels to reflect controller-account linking
- `src/app/api/users/route.ts`
  - returns controlled nations instead of `user.nation`
- `src/app/api/users/[id]/assign-nation/route.ts`
  - now links controller account to a nation and promotes to `LEADER`
- `src/app/api/users/[id]/role/route.ts`
  - simplified role response shape
- `src/app/api/nations/route.ts`
- `src/app/api/nations/[id]/route.ts`
  - broadened access to include `OWNER`
  - include `leaderName` in response shaping

## After replacing files
Run these commands:
1. `pnpm prisma generate`
2. create a Prisma migration for the schema changes
3. apply the migration
4. restart Next.js
