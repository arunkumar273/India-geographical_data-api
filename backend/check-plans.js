const prisma = require("./src/lib/prisma");

async function check() {
  try {
    const plans = await prisma.plans.findMany({
      orderBy: {
        id: "asc",
      },
    });

    console.log(JSON.stringify(plans, null, 2));
  } catch (error) {
    console.error("ERROR:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

check();