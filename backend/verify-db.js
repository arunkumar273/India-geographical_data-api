const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("\n========== DATABASE VERIFICATION ==========\n");

  const countries = await prisma.countries.count();
  const plans = await prisma.plans.count();
  const states = await prisma.states.count();
  const districts = await prisma.districts.count();
  const subDistricts = await prisma.sub_districts.count();
  const villages = await prisma.villages.count();

  console.log("Countries:     ", countries);
  console.log("Plans:         ", plans);
  console.log("States:        ", states);
  console.log("Districts:     ", districts);
  console.log("Sub-Districts: ", subDistricts);
  console.log("Villages:      ", villages);

  console.log("\n========== COUNTRY ==========\n");

  const india = await prisma.countries.findUnique({
    where: {
      id: 1
    }
  });

  console.log(india);

  console.log("\n========== STATES ==========\n");

  const statesList = await prisma.states.findMany({
    select: {
      id: true,
      state_code: true,
      state_name: true,
      country_id: true
    },
    orderBy: {
      id: "asc"
    }
  });

  console.log("Total states:", statesList.length);

  const wrongStates = statesList.filter(
    (state) => state.country_id !== 1
  );

  console.log("States linked to India:", statesList.length - wrongStates.length);
  console.log("States with wrong country:", wrongStates.length);

  if (wrongStates.length > 0) {
    console.table(wrongStates);
  }

  console.log("\n========== PLANS ==========\n");

  const planList = await prisma.plans.findMany({
    orderBy: {
      id: "asc"
    }
  });

  console.table(planList);

  console.log("\n========== USERS ==========\n");

  const users = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      plan_id: true,
      approval_status: true
    }
  });

  console.log("Total users:", users.length);

  const invalidUsers = users.filter(
    (user) => ![1, 2, 3, 4].includes(user.plan_id)
  );

  console.log("Users with invalid plan:", invalidUsers.length);

  if (invalidUsers.length > 0) {
    console.table(invalidUsers);
  }

  console.log("\n========== VERIFICATION COMPLETE ==========\n");
}

main()
  .catch((error) => {
    console.error("\nVERIFICATION ERROR:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });