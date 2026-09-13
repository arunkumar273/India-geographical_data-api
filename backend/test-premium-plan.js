const prisma = require("./src/lib/prisma");

async function test() {
  try {
    const user = await prisma.users.update({
      where: {
        id: 3,
      },
      data: {
        plan_id: 2,
      },
      select: {
        id: true,
        email: true,
        plan_id: true,
        plan: {
          select: {
            code: true,
            name: true,
            daily_request_limit: true,
            burst_limit: true,
          },
        },
      },
    });

    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    console.error("ERROR:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();