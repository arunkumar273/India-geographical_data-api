require("dotenv").config();

const bcrypt = require("bcrypt");
const prisma = require("./src/lib/prisma");

async function createAdmin() {
  const email = "admin@example.com";
  const password = "ChangeThisAdminPassword123!";
  const name = "Platform Administrator";

  try {
    const existingUser = await prisma.users.findUnique({
      where: {
        email
      }
    });

    if (existingUser) {
      console.log("Admin user already exists.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.users.create({
      data: {
        email,
        password_hash: passwordHash,
        name,
        role: "ADMIN",
        is_active: true
      }
    });

    console.log("Admin created successfully.");
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
  } catch (error) {
    console.error("Failed to create admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();