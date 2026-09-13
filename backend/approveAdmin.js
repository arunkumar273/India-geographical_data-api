require("dotenv").config();

const prisma = require("./src/lib/prisma");

async function approveAdmin() {
  try {
    const admin = await prisma.users.update({
      where: {
        email: "admin@example.com"
      },
      data: {
        approval_status: "APPROVED",
        is_active: true
      }
    });

    console.log("Admin approved successfully.");
    console.log("Email:", admin.email);
    console.log("Status:", admin.approval_status);
    console.log("Active:", admin.is_active);
  } catch (error) {
    console.error("Failed to approve admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

approveAdmin();