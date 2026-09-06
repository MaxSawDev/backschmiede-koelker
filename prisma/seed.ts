// prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const rawUsername = process.env.ADMIN_USERNAME;
const rawPassword = process.env.ADMIN_PASSWORD;
const seedMode = (process.env.ADMIN_SEED_MODE ?? "off").trim().toLowerCase();

const ADMIN_USERNAME = rawUsername?.trim() ?? "";
const ADMIN_PASSWORD = rawPassword?.trim() ?? "";

if (seedMode === "off" || seedMode === "") {
  console.log("[seed] Skipping: ADMIN_SEED_MODE is off.");
  process.exit(0);
}

if (seedMode !== "create" && seedMode !== "update") {
  throw new Error("ADMIN_SEED_MODE must be one of: off, create, update");
}

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  throw new Error(
    "ADMIN_USERNAME and ADMIN_PASSWORD must both be set when ADMIN_SEED_MODE is create or update",
  );
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({
    where: { username: ADMIN_USERNAME },
    select: { id: true },
  });

  if (existing && seedMode === "create") {
    console.log(`[seed] Skipping: user already exists: ${ADMIN_USERNAME}`);
    return;
  }

  if (!existing && seedMode === "update") {
    throw new Error(`[seed] Cannot update missing user: ${ADMIN_USERNAME}`);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  if (existing) {
    await prisma.user.update({
      where: { username: ADMIN_USERNAME },
      data: { passwordHash, role: "ADMIN" },
    });
    console.log(`[seed] Admin user updated: ${ADMIN_USERNAME}`);
    return;
  }

  await prisma.user.create({
    data: {
      username: ADMIN_USERNAME,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`[seed] Admin user created: ${ADMIN_USERNAME}`);
}

main()
  .catch((e) => {
    console.error("[seed] Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end().catch(() => {});
  });
