export type ScoreInput = {
  hardFilterPass: boolean;
  preferenceFit: number;
  intentFit: number;
  interestSimilarity: number;
  freshness: number;
  reciprocalProbability: number;
  trustQuality: number;
  explorationBonus: number;
  safetyRisk: number;
  repetitionPenalty: number;
};

export function candidateScore(input: ScoreInput): number {
  if (!input.hardFilterPass) return 0;
  const raw =
    input.preferenceFit +
    input.intentFit +
    input.interestSimilarity +
    input.freshness +
    input.reciprocalProbability +
    input.trustQuality +
    input.explorationBonus -
    input.safetyRisk -
    input.repetitionPenalty;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function hardFilter(input: {
  age: number;
  minAge: number;
  maxAge: number;
  gender: string;
  wantedGender: string;
  intent: string;
  wantedIntent: string;
  distanceRank: number;
  maxDistanceRank: number;
  blocked: boolean;
}): boolean {
  if (input.blocked) return false;
  if (input.age < input.minAge || input.age > input.maxAge) return false;
  if (input.wantedGender !== "qualquer" && input.gender !== input.wantedGender) return false;
  if (input.wantedIntent !== "qualquer" && input.intent !== input.wantedIntent) return false;
  if (input.distanceRank > input.maxDistanceRank) return false;
  return true;
}
