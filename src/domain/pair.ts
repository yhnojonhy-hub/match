export function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function isParticipant(viewerId: string, userLow: string, userHigh: string): boolean {
  return viewerId === userLow || viewerId === userHigh;
}
