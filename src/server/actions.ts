import { db } from "@/server/db";
import { writeAudit } from "@/server/audit";
import { hashPassword, verifyPassword } from "@/server/password";
import { ageFromBirthDate } from "@/domain/age";
import { distanceLabel, distanceRank, maxDistanceRank } from "@/domain/distance";
import { batchLimit, likeLimit } from "@/domain/limits";
import { isParticipant, orderedPair } from "@/domain/pair";
import { saoPauloDate } from "@/domain/sao-paulo";
import { messageHasRiskHint } from "@/domain/scam";
import { candidateScore, hardFilter } from "@/domain/score";
import { HttpError } from "@/server/http";
import { removePhoto } from "@/server/photo";

const publicProfile = {
  userId: true,
  displayName: true,
  bio: true,
  intent: true,
  age: true,
  gender: true,
  gridCell: true,
  interests: true,
  photoName: true,
} as const;

export async function claimOnce(userId: string, scope: string, key: string) {
  if (!key) throw new HttpError(400, "Faltou a chave da ação.");
  try {
    await db.idempotencyKey.create({ data: { userId, scope, key } });
  } catch {
    return false;
  }
  return true;
}

export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
  birthDate: string;
  intent: string;
  gender: string;
  gridCell: string;
}) {
  if (input.password.length < 8) throw new HttpError(400, "A senha precisa de 8 caracteres.");
  const age = ageFromBirthDate(input.birthDate);
  if (age === null || age < 18 || age > 110) {
    throw new HttpError(400, "A data de nascimento não entra neste produto.");
  }
  const existing = await db.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new HttpError(400, "Esse e-mail já tem conta.");
  const passwordHash = await hashPassword(input.password);
  return db.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      ageCheck: {
        create: { method: "simulada", result: "18+" },
      },
      profile: {
        create: {
          displayName: input.displayName,
          bio: "",
          intent: input.intent,
          age,
          gender: input.gender,
          gridCell: input.gridCell,
          interests: "",
        },
      },
      preference: {
        create: {
          minAge: 18,
          maxAge: 80,
          gender: "qualquer",
          intent: input.intent,
          maxDistance: "15",
        },
      },
      subscription: { create: { plan: "free" } },
    },
  });
}

export async function loginUser(email: string, password: string) {
  const normalized = email.toLowerCase();
  const lock = await db.loginLock.findUnique({ where: { email: normalized } });
  if (lock?.lockedUntil && lock.lockedUntil > new Date()) {
    throw new HttpError(429, "E-mail ou senha não conferem.");
  }
  const user = await db.user.findUnique({ where: { email: normalized } });
  const valid = user && !user.deletedAt ? await verifyPassword(password, user.passwordHash) : false;
  if (!valid || !user) {
    const failures = (lock?.failures ?? 0) + 1;
    await db.loginLock.upsert({
      where: { email: normalized },
      create: {
        email: normalized,
        failures,
        lockedUntil: failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
      update: {
        failures,
        lockedUntil: failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
    });
    throw new HttpError(401, "E-mail ou senha não conferem.");
  }
  await db.loginLock.deleteMany({ where: { email: normalized } });
  return user;
}

async function blockedSet(userId: string) {
  const rows = await db.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
  });
  const ids = new Set<string>();
  for (const row of rows) {
    ids.add(row.blockerId === userId ? row.blockedId : row.blockerId);
  }
  return ids;
}

export async function ensureBatch(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true, preference: true, subscription: true },
  });
  if (!user?.profile || !user.preference) {
    throw new HttpError(400, "Complete o perfil antes do lote.");
  }
  const batchDate = saoPauloDate();
  const existing = await db.dailyBatch.findUnique({
    where: { userId_batchDate: { userId, batchDate } },
  });
  if (existing) return { user, batch: existing };
  const blocked = await blockedSet(userId);
  const acted = await db.like.findMany({ where: { fromUserId: userId }, select: { toUserId: true } });
  const passed = await db.pass.findMany({ where: { fromUserId: userId }, select: { toUserId: true } });
  const skip = new Set([...acted.map((row) => row.toUserId), ...passed.map((row) => row.toUserId)]);
  const profiles = await db.profile.findMany({
    where: { userId: { not: userId } },
  });
  const midpoint = (user.preference.minAge + user.preference.maxAge) / 2;
  const ranked = profiles
    .map((profile) => {
      const rank = distanceRank(user.profile!.gridCell, profile.gridCell);
      const interests = sharedInterests(user.profile!.interests, profile.interests);
      const pass = hardFilter({
        age: profile.age,
        minAge: user.preference!.minAge,
        maxAge: user.preference!.maxAge,
        gender: profile.gender,
        wantedGender: user.preference!.gender,
        intent: profile.intent,
        wantedIntent: user.preference!.intent,
        distanceRank: rank,
        maxDistanceRank: maxDistanceRank(user.preference!.maxDistance),
        blocked: blocked.has(profile.userId) || skip.has(profile.userId),
      });
      return {
        id: profile.userId,
        score: candidateScore({
          hardFilterPass: pass,
          preferenceFit: Math.max(0, 25 - Math.abs(profile.age - midpoint)),
          intentFit: profile.intent === user.preference!.intent ? 20 : 8,
          interestSimilarity: Math.min(15, interests * 5),
          freshness: 8,
          reciprocalProbability: 6,
          trustQuality: 8,
          explorationBonus: 4,
          safetyRisk: 0,
          repetitionPenalty: 0,
        }),
      };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  const batch = await db.dailyBatch.create({
    data: { userId, batchDate, candidateIds: ranked.map((row) => row.id).join(",") },
  });
  return { user, batch };
}

function sharedInterests(a: string, b: string) {
  const left = new Set(a.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
  return b.split(",").map((item) => item.trim().toLowerCase()).filter((item) => left.has(item)).length;
}

export async function visibleBatch(userId: string) {
  const { user, batch } = await ensureBatch(userId);
  const plan = user.subscription?.plan ?? "free";
  const ids = batch.candidateIds.split(",").filter(Boolean).slice(0, batchLimit(plan));
  const [likes, passes] = await Promise.all([
    db.like.findMany({ where: { fromUserId: userId, toUserId: { in: ids } }, select: { toUserId: true } }),
    db.pass.findMany({ where: { fromUserId: userId, toUserId: { in: ids } }, select: { toUserId: true } }),
  ]);
  const done = new Set([...likes.map((row) => row.toUserId), ...passes.map((row) => row.toUserId)]);
  const remaining = ids.filter((id) => !done.has(id));
  const profiles = await db.profile.findMany({
    where: { userId: { in: remaining } },
    select: publicProfile,
  });
  const byId = new Map(profiles.map((profile) => [profile.userId, profile]));
  const cards = remaining
    .map((id) => byId.get(id))
    .filter((profile) => profile !== undefined)
    .map((profile) => ({
      ...profile,
      distance: distanceLabel(user.profile!.gridCell, profile.gridCell),
    }));
  const likesToday = await db.like.count({
    where: { fromUserId: userId, createdAt: { gte: startOfSaoPauloDay() } },
  });
  return {
    cards,
    total: ids.length,
    remaining: cards.length,
    plan,
    likesToday,
    likeLimit: likeLimit(plan),
  };
}

function startOfSaoPauloDay() {
  const date = saoPauloDate();
  return new Date(`${date}T03:00:00.000Z`);
}

async function assertInBatch(userId: string, targetId: string) {
  const { user, batch } = await ensureBatch(userId);
  const ids = batch.candidateIds.split(",").filter(Boolean).slice(0, batchLimit(user.subscription?.plan ?? "free"));
  if (!ids.includes(targetId)) throw new HttpError(404, "Essa pessoa não está no lote de hoje.");
  return user;
}

export async function sendLike(userId: string, targetId: string, key: string) {
  const fresh = await claimOnce(userId, "like", key);
  if (!fresh) return;
  const user = await assertInBatch(userId, targetId);
  const plan = user.subscription?.plan ?? "free";
  const limit = likeLimit(plan);
  if (limit !== null) {
    const likesToday = await db.like.count({
      where: { fromUserId: userId, createdAt: { gte: startOfSaoPauloDay() } },
    });
    if (likesToday >= limit) throw new HttpError(403, "O lote gratuito de hoje já usou os 10 sinais.");
  }
  await db.like.upsert({
    where: { fromUserId_toUserId: { fromUserId: userId, toUserId: targetId } },
    create: { fromUserId: userId, toUserId: targetId },
    update: {},
  });
  const back = await db.like.findUnique({
    where: { fromUserId_toUserId: { fromUserId: targetId, toUserId: userId } },
  });
  if (!back) return;
  const [userLow, userHigh] = orderedPair(userId, targetId);
  await db.matchPair.upsert({
    where: { userLow_userHigh: { userLow, userHigh } },
    create: { userLow, userHigh },
    update: { closedAt: null },
  });
}

export async function sendPass(userId: string, targetId: string, key: string) {
  const fresh = await claimOnce(userId, "pass", key);
  if (!fresh) return;
  await assertInBatch(userId, targetId);
  await db.pass.upsert({
    where: { fromUserId_toUserId: { fromUserId: userId, toUserId: targetId } },
    create: { fromUserId: userId, toUserId: targetId },
    update: {},
  });
}

export async function listMatches(userId: string) {
  return db.matchPair.findMany({
    where: {
      closedAt: null,
      OR: [{ userLow: userId }, { userHigh: userId }],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function loadMatch(userId: string, matchId: string) {
  const match = await db.matchPair.findUnique({
    where: { id: matchId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      intents: true,
      windows: true,
      plan: true,
    },
  });
  if (!match || !isParticipant(userId, match.userLow, match.userHigh)) {
    throw new HttpError(404, "Conversa não encontrada.");
  }
  const otherId = match.userLow === userId ? match.userHigh : match.userLow;
  const blocked = await blockedSet(userId);
  if (blocked.has(otherId)) throw new HttpError(404, "Conversa não encontrada.");
  const [other, me] = await Promise.all([
    db.profile.findUnique({ where: { userId: otherId }, select: publicProfile }),
    db.profile.findUnique({ where: { userId }, select: { interests: true } }),
  ]);
  const mine = match.intents.some((intent) => intent.userId === userId);
  const theirs = match.intents.some((intent) => intent.userId === otherId);
  return {
    match,
    other,
    otherId,
    myInterests: me?.interests ?? "",
    want: { mine, theirs: mine && theirs },
  };
}

export async function postMessage(userId: string, matchId: string, body: string) {
  if (!body || body.length > 1000) throw new HttpError(400, "Escreva uma mensagem de até 1000 caracteres.");
  const loaded = await loadMatch(userId, matchId);
  if (loaded.match.closedAt) throw new HttpError(400, "Essa conversa foi encerrada.");
  await db.message.create({
    data: {
      matchId,
      senderId: userId,
      body,
      riskHint: messageHasRiskHint(body),
    },
  });
}

export async function closeMatch(userId: string, matchId: string) {
  const loaded = await loadMatch(userId, matchId);
  await db.matchPair.update({ where: { id: loaded.match.id }, data: { closedAt: new Date() } });
}

export async function reportPerson(input: {
  reporterId: string;
  targetId: string;
  matchId?: string;
  reason: string;
}) {
  if (input.reason.length < 3) throw new HttpError(400, "Conte o que aconteceu.");
  let messageIds = "";
  if (input.matchId) {
    const match = await db.matchPair.findUnique({ where: { id: input.matchId } });
    if (!match || !isParticipant(input.reporterId, match.userLow, match.userHigh)) {
      throw new HttpError(404, "Conversa não encontrada.");
    }
    const messages = await db.message.findMany({ where: { matchId: input.matchId }, select: { id: true } });
    messageIds = messages.map((message) => message.id).join(",");
  }
  const report = await db.report.create({
    data: {
      reporterId: input.reporterId,
      targetId: input.targetId,
      matchId: input.matchId,
      reason: input.reason,
      messageIds,
    },
  });
  await writeAudit({
    actorId: input.reporterId,
    action: "report_created",
    targetType: "report",
    targetId: report.id,
    reason: input.reason,
    after: { targetId: input.targetId },
  });
}

export async function blockPerson(blockerId: string, blockedId: string) {
  await db.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId },
    update: {},
  });
}

export async function markWant(userId: string, matchId: string) {
  const loaded = await loadMatch(userId, matchId);
  await db.dateIntent.upsert({
    where: { matchId_userId: { matchId: loaded.match.id, userId } },
    create: { matchId: loaded.match.id, userId },
    update: {},
  });
}

export async function saveWindow(userId: string, matchId: string, windowLabel: string) {
  const loaded = await loadMatch(userId, matchId);
  const both = loaded.match.intents.length >= 2 || (loaded.want.mine && loaded.want.theirs);
  const intents = await db.dateIntent.count({ where: { matchId } });
  if (intents < 2 && !both) throw new HttpError(400, "Os dois ainda não marcaram que querem se encontrar.");
  if (intents < 2) throw new HttpError(400, "Os dois ainda não marcaram que querem se encontrar.");
  if (!windowLabel) throw new HttpError(400, "Escolha uma janela de horário.");
  await db.availability.upsert({
    where: { matchId_userId: { matchId, userId } },
    create: { matchId, userId, windowLabel },
    update: { windowLabel },
  });
}

export async function savePlace(userId: string, matchId: string, placeName: string) {
  const loaded = await loadMatch(userId, matchId);
  if (loaded.match.windows.length < 2) throw new HttpError(400, "Falta a janela de horário de alguém.");
  if (placeName.length < 3) throw new HttpError(400, "Escreva um lugar público.");
  await db.datePlan.upsert({
    where: { matchId },
    create: {
      matchId,
      placeName,
      whenLabel: [...new Set(loaded.match.windows.map((window) => window.windowLabel))].join(" · "),
    },
    update: {
      placeName,
      whenLabel: [...new Set(loaded.match.windows.map((window) => window.windowLabel))].join(" · "),
    },
  });
}

export async function activatePlus(userId: string, key: string) {
  const fresh = await claimOnce(userId, "plus", key);
  if (!fresh) return;
  await db.subscription.upsert({
    where: { userId },
    create: { userId, plan: "plus" },
    update: { plan: "plus" },
  });
}

export async function incomingLikes(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, include: { subscription: true } });
  if (user?.subscription?.plan !== "plus") return [];
  const likes = await db.like.findMany({ where: { toUserId: userId }, select: { fromUserId: true } });
  return db.profile.findMany({
    where: { userId: { in: likes.map((like) => like.fromUserId) } },
    select: publicProfile,
  });
}

export async function reviewReport(adminId: string, reportId: string, reason: string) {
  const before = await db.report.findUnique({ where: { id: reportId } });
  if (!before) throw new HttpError(404, "Denúncia não encontrada.");
  await db.report.update({ where: { id: reportId }, data: { status: "revista" } });
  await writeAudit({
    actorId: adminId,
    action: "report_reviewed",
    targetType: "report",
    targetId: reportId,
    reason,
    before: { status: before.status },
    after: { status: "revista" },
  });
}

export async function adminHome() {
  const [reports, impressions, likes, matches, messages, plans] = await Promise.all([
    db.report.findMany({ where: { status: "aberta" }, orderBy: { createdAt: "asc" } }),
    db.dailyBatch.count(),
    db.like.count(),
    db.matchPair.count(),
    db.message.count(),
    db.datePlan.count(),
  ]);
  return { reports, funnel: { impressions, likes, matches, messages, plans } };
}

export async function eraseAccount(userId: string) {
  await db.session.deleteMany({ where: { userId } });
  await db.message.updateMany({ where: { senderId: userId }, data: { body: "" } });
  const profile = await db.profile.findUnique({ where: { userId }, select: { photoName: true } });
  await db.profile.updateMany({
    where: { userId },
    data: { displayName: "Conta encerrada", bio: "", interests: "", photoName: "" },
  });
  if (profile?.photoName) await removePhoto(profile.photoName);
  await db.user.update({
    where: { id: userId },
    data: {
      email: `encerrada-${userId}@local.invalid`,
      passwordHash: "apagada",
      deletedAt: new Date(),
    },
  });
}

export async function namesFor(ids: string[]) {
  const profiles = await db.profile.findMany({
    where: { userId: { in: ids } },
    select: { userId: true, displayName: true, photoName: true },
  });
  return new Map(profiles.map((profile) => [profile.userId, profile]));
}
