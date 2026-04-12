import { PrismaClient, Role } from "@prisma/client";
import { canonNations, createNationWikiTemplate } from "@nation-wheel/shared";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("nationwheel-dev", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@nationwheel.local" },
    update: { role: Role.ADMIN, passwordHash },
    create: {
      name: "Admin Command",
      email: "admin@nationwheel.local",
      role: Role.ADMIN,
      passwordHash,
    },
  });

  const lore = await prisma.user.upsert({
    where: { email: "lore@nationwheel.local" },
    update: { role: Role.LORE, passwordHash },
    create: {
      name: "Lore Directorate",
      email: "lore@nationwheel.local",
      role: Role.LORE,
      passwordHash,
    },
  });

  for (const nation of canonNations) {
    const createdNation = await prisma.nation.upsert({
      where: { slug: nation.slug },
      update: {
        name: nation.name,
        people: nation.people,
        government: nation.government,
        gdp: nation.gdp,
        economy: nation.economy,
        military: nation.military,
      },
      create: {
        name: nation.name,
        slug: nation.slug,
        people: nation.people,
        government: nation.government,
        gdp: nation.gdp,
        economy: nation.economy,
        military: nation.military,
      },
    });
    const content = createNationWikiTemplate(nation);

    await prisma.nationWiki.upsert({
      where: { nationId: createdNation.id },
      update: {
        updatedByUserId: lore.id,
      },
      create: {
        nationId: createdNation.id,
        content,
        updatedByUserId: lore.id,
      },
    });
  }

  const primis = await prisma.nation.findUniqueOrThrow({
    where: { slug: "primis" },
  });
  const leader = await prisma.user.upsert({
    where: { email: "primis.leader@nationwheel.local" },
    update: {
      role: Role.LEADER,
      nationId: primis.id,
      passwordHash,
    },
    create: {
      name: "Primis Leader",
      email: "primis.leader@nationwheel.local",
      role: Role.LEADER,
      nationId: primis.id,
      passwordHash,
    },
  });

  await prisma.nation.update({
    where: { id: primis.id },
    data: { leaderUserId: leader.id },
  });

  console.log(`Seeded Nation Wheel data. Admin user: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
