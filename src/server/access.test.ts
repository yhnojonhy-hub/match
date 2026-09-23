import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { orderedPair } from "@/domain/pair";
import { loadMatch, postMessage, reportPerson } from "@/server/actions";
import { db } from "@/server/db";
import { HttpError } from "@/server/http";

const emails = ["iso-a@exemplo.local", "iso-b@exemplo.local", "iso-c@exemplo.local"];

async function databaseReady(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe("conversa de outra pessoa", () => {
  let matchId = "";

  afterAll(async () => {
    if (matchId) await db.matchPair.delete({ where: { id: matchId } }).catch(() => undefined);
    await db.user.deleteMany({ where: { email: { in: emails } } }).catch(() => undefined);
  });

  it("devolve 404 para quem não está no par", async () => {
    const ready = await databaseReady();
    if (!ready) {
      if (process.env.REQUIRE_DB === "1") throw new Error("banco ausente");
      return;
    }
    await db.user.deleteMany({ where: { email: { in: emails } } });
    const created = [];
    for (const email of emails) {
      created.push(await db.user.create({ data: { email, passwordHash: "teste" } }));
    }
    const outsider = created[2];
    if (!outsider) throw new Error("faltou a terceira conta");
    const [low, high] = orderedPair(created[0]!.id, created[1]!.id);
    const match = await db.matchPair.create({ data: { userLow: low, userHigh: high } });
    matchId = match.id;
    await expect(loadMatch(outsider.id, match.id)).rejects.toMatchObject({ status: 404 });
    await expect(postMessage(outsider.id, match.id, "oi")).rejects.toBeInstanceOf(HttpError);
    await expect(
      reportPerson({
        reporterId: outsider.id,
        targetId: created[0]!.id,
        matchId: match.id,
        reason: "não é desta conversa",
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
