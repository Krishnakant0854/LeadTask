import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

async function main() {
  const admin = await prisma.user.upsert({
    where: { employeeId: "ADMIN001" },
    update: {},
    create: {
      employeeId: "ADMIN001",
      name: "Admin",
      role: "ADMIN",
      mobile: "9999999999",
      email: "admin@example.com",
      state: "Delhi",
      passwordHash: hashPassword("Admin@123456")
    }
  });

  const employee = await prisma.user.upsert({
    where: { employeeId: "EMP001" },
    update: {},
    create: {
      employeeId: "EMP001",
      name: "Rahul Sharma",
      role: "EMPLOYEE",
      mobile: "8888888888",
      email: "rahul@example.com",
      state: "Haryana",
      passwordHash: hashPassword("Employee@123")
    }
  });

  const customer = await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    update: {},
    create: {
      id: "seed-customer-1",
      userId: employee.id,
      customerName: "Amit Verma",
      mobile: "7777777777",
      product: "Insurance",
      date: new Date()
    }
  });

  await prisma.leadProcess.upsert({
    where: { customerId: customer.id },
    update: {},
    create: {
      customerId: customer.id,
      status: "IN_PROGRESS",
      progress: 45,
      income: 0
    }
  });

  await prisma.poster.upsert({
    where: { id: "seed-poster-1" },
    update: { active: true },
    create: {
      id: "seed-poster-1",
      imageUrl: "/poster-placeholder.svg",
      active: true
    }
  });

  console.log("Seeded admin ADMIN001 / Admin@123456");
  console.log("Seeded employee EMP001 / Employee@123");
  console.log(`Admin id: ${admin.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
