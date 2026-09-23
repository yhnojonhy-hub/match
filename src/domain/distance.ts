export function distanceRank(a: string, b: string): number {
  if (a === b) return 0;
  const cityA = a.split(":")[0];
  const cityB = b.split(":")[0];
  if (cityA && cityA === cityB) return 1;
  return 2;
}

export function distanceLabel(a: string, b: string): string {
  const rank = distanceRank(a, b);
  if (rank === 0) return "menos de 5 km";
  if (rank === 1) return "menos de 15 km";
  return "mais longe";
}

export function maxDistanceRank(preference: string): number {
  if (preference === "5") return 0;
  if (preference === "15") return 1;
  return 2;
}
