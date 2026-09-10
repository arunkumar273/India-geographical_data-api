require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.users.findUnique({
      where: {
        email: "testb2b@example.com",
      },
    });

    if (!user) {
      console.log("USER NOT FOUND");
      return;
    }

    console.log("USER FOUND");
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
    });
  } catch (error) {
    console.error("DATABASE ERROR:");
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();