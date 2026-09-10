require("dotenv").config();

const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const newPassword = "B2BTest@2026";

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const user = await prisma.users.update({
      where: {
        email: "testb2b@example.com",
      },
      data: {
        password_hash: passwordHash,
        is_active: true,
      },
    });

    console.log("PASSWORD RESET SUCCESSFULLY");
    console.log("Email:", user.email);
    console.log("New password:", newPassword);
  } catch (error) {
    console.error("ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();