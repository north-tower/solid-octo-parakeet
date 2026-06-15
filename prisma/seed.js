const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const levelConfig = [
  { level: 1, xpRequired: 0, referralPercent: 10 },
  { level: 2, xpRequired: 500, referralPercent: 12 },
  { level: 3, xpRequired: 1050, referralPercent: 14 },
  { level: 4, xpRequired: 1650, referralPercent: 16 },
  { level: 5, xpRequired: 2300, referralPercent: 18 },
  { level: 6, xpRequired: 3000, referralPercent: 20 },
];

const rewardCatalog = [
  { gameSlug: 'fifa', name: 'FIFA Points - 500', coinCost: 500 },
  { gameSlug: 'fortnite', name: 'V-Bucks - 1000', coinCost: 800 },
  { gameSlug: 'lol', name: 'Riot Points - 650', coinCost: 650 },
  { gameSlug: 'steam', name: 'Steam Gift Card - $10', coinCost: 1000 },
  { gameSlug: 'roblox', name: 'Roblox Gift Card - $10', coinCost: 1000 },
  { gameSlug: 'minecraft', name: 'Minecraft Gift Card - $10', coinCost: 1000 },
];

async function main() {
  for (const level of levelConfig) {
    await prisma.levelConfig.upsert({
      where: { level: level.level },
      update: {
        xpRequired: level.xpRequired,
        referralPercent: level.referralPercent,
      },
      create: level,
    });
  }

  for (const item of rewardCatalog) {
    const existing = await prisma.rewardCatalog.findFirst({
      where: { gameSlug: item.gameSlug, name: item.name },
    });

    if (existing) {
      await prisma.rewardCatalog.update({
        where: { id: existing.id },
        data: { coinCost: item.coinCost, isActive: true },
      });
    } else {
      await prisma.rewardCatalog.create({ data: item });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
