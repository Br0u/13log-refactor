import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || "";
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!process.env.DATABASE_URL) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  if (!adminUsername || !adminPassword) {
    throw new Error("Missing admin seed credentials: ADMIN_USERNAME and ADMIN_PASSWORD are required");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await db.adminUser.upsert({
    where: { username: adminUsername },
    update: { passwordHash },
    create: {
      username: adminUsername,
      passwordHash,
    },
  });

  await db.category.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      name: "Default",
      slug: "default",
      description: "Default category",
    },
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
