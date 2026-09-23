import "dotenv/config";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/server/password";

async function seedPhoto(file: string): Promise<string> {
  const bytes = await readFile(path.join(process.cwd(), "public", "seed", file));
  const output = await sharp(bytes)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  const name = `${randomBytes(16).toString("hex")}.jpg`;
  await mkdir(path.join(process.cwd(), "storage"), { recursive: true });
  await writeFile(path.join(process.cwd(), "storage", name), output);
  return name;
}

if (process.env.NODE_ENV === "production") {
  throw new Error("O seed não roda em produção.");
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Defina ${name}.`);
  return value;
}

const adminPassword = requiredEnv("SEED_ADMIN_PASSWORD");
const demoPassword = requiredEnv("SEED_DEMO_PASSWORD");

const db = new PrismaClient({ adapter: new PrismaPg(process.env.MIGRATE_URL ?? "") });

async function main() {

const people = [
  ["marina@exemplo.local", "Marina", "serio", "mulher", 29, "sao-paulo:pinheiros", "café, trilha, cinema", "Moro em Pinheiros e gosto de marcar o encontro cedo.", "marina.jpg"],
  ["helena@exemplo.local", "Helena", "serio", "mulher", 31, "sao-paulo:vila-madalena", "café, livros", "Leio no fim da tarde e caminho até um café.", "helena.jpg"],
  ["lia@exemplo.local", "Lia", "casual", "mulher", 27, "sao-paulo:moema", "música", "Procuro algo leve, sem pressa de rótulo.", "bia.jpg"],
  ["bia@exemplo.local", "Bia", "serio", "mulher", 33, "sao-paulo:pinheiros", "trilha, comida", "Trilha curta no domingo me interessa.", "bia.jpg"],
  ["rita@exemplo.local", "Rita", "serio", "mulher", 28, "sao-paulo:moema", "cinema", "Cinema no meio da semana funciona.", "helena.jpg"],
  ["olga@exemplo.local", "Olga", "serio", "mulher", 35, "sao-paulo:vila-madalena", "livros, café", "Prefiro conversa longa a lista de perguntas.", "marina.jpg"],
  ["tina@exemplo.local", "Tina", "serio", "mulher", 26, "sao-paulo:pinheiros", "comida", "Cozinho e gosto de feira.", "bia.jpg"],
  ["nina@exemplo.local", "Nina", "amigos", "mulher", 24, "sao-paulo:centro", "música", "Estou mais para amizade.", "helena.jpg"],
  ["caio@exemplo.local", "Caio", "serio", "homem", 32, "sao-paulo:pinheiros", "trilha", "Corro no parque de manhã.", "caio.jpg"],
  ["dora@exemplo.local", "Dora", "serio", "mulher", 30, "campinas:cambui", "livros", "Estou em Campinas nesta temporada.", "marina.jpg"],
] as const;

await db.message.deleteMany();
await db.datePlan.deleteMany();
await db.availability.deleteMany();
await db.dateIntent.deleteMany();
await db.matchPair.deleteMany();
await db.report.deleteMany();
await db.block.deleteMany();
await db.pass.deleteMany();
await db.like.deleteMany();
await db.dailyBatch.deleteMany();
await db.loginLock.deleteMany();
await db.idempotencyKey.deleteMany();
await db.auditEvent.deleteMany();
await db.session.deleteMany();
await db.user.deleteMany();

const demoHash = await hashPassword(demoPassword);
const adminHash = await hashPassword(adminPassword);

await db.user.create({
  data: {
    email: "admin@exemplo.local",
    passwordHash: adminHash,
    role: "admin",
    ageCheck: { create: { method: "simulada", result: "18+" } },
  },
});

const created = [];
for (const [email, displayName, intent, gender, age, gridCell, interests, bio, photoFile] of people) {
  const photoName = await seedPhoto(photoFile);
  const user = await db.user.create({
    data: {
      email,
      passwordHash: demoHash,
      ageCheck: { create: { method: "simulada", result: "18+" } },
      profile: { create: { displayName, bio, intent, age, gender, gridCell, interests, photoName } },
      preference: {
        create: { minAge: 18, maxAge: 80, gender: "qualquer", intent: "qualquer", maxDistance: "qualquer" },
      },
      subscription: { create: { plan: "free" } },
    },
  });
  created.push(user);
}

const marina = created[0];
const helena = created[1];
if (!marina || !helena) throw new Error("Seed incompleto.");

await db.preference.update({
  where: { userId: marina.id },
  data: { minAge: 26, maxAge: 36, gender: "mulher", intent: "serio", maxDistance: "15" },
});

await db.like.create({ data: { fromUserId: helena.id, toUserId: marina.id } });

  console.log("Seed pronto.");
  console.log("Demo: marina@exemplo.local");
  console.log("Admin: admin@exemplo.local");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
