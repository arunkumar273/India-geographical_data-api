require("dotenv").config();

const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testPassword() {
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

    const passwordMatches = await bcrypt.compare(
      "B2BTest@2026",
      user.password_hash
    );

    console.log("USER FOUND");
    console.log("Email:", user.email);
    console.log("Active:", user.is_active);
    console.log("Role:", user.role);
    console.log("Password matches:", passwordMatches);
  } catch (error) {
    console.error("ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();