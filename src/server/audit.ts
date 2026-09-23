import { createHash } from "node:crypto";
import { db } from "@/server/db";

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function writeAudit(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  before?: unknown;
  after?: unknown;
}) {
  await db.auditEvent.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      beforeHash: digest(input.before ?? null),
      afterHash: digest(input.after ?? null),
    },
  });
}
