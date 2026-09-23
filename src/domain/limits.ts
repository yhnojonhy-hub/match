export function batchLimit(plan: string): number {
  return plan === "plus" ? 20 : 8;
}

export function likeLimit(plan: string): number | null {
  return plan === "plus" ? null : 10;
}

export const discoveryProfileFields = [
  "displayName",
  "bio",
  "intent",
  "age",
  "gender",
  "gridCell",
  "interests",
] as const;
