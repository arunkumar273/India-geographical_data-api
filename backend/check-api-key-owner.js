const prisma = require("./src/lib/prisma");

async function check() {
  try {
    const keys = await prisma.api_keys_new.findMany({
      select: {
        id: true,
        name: true,
        is_active: true,
        user: {
          select: {
            id: true,
            email: true,
            plan_id: true,
            plan: {
              select: {
                code: true,
                burst_limit: true,
                daily_request_limit: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    console.log(JSON.stringify(keys, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

check();