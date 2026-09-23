import { describe, expect, it } from "vitest";
import { ageFromBirthDate } from "./age";
import { distanceLabel, distanceRank } from "./distance";
import { discoveryProfileFields } from "./limits";
import { isParticipant, orderedPair } from "./pair";
import { saoPauloDate } from "./sao-paulo";
import { messageHasRiskHint } from "./scam";
import { candidateScore, hardFilter } from "./score";

describe("candidateScore", () => {
  it("zera quando o filtro rígido falha", () => {
    expect(
      candidateScore({
        hardFilterPass: false,
        preferenceFit: 25,
        intentFit: 20,
        interestSimilarity: 15,
        freshness: 10,
        reciprocalProbability: 10,
        trustQuality: 10,
        explorationBonus: 10,
        safetyRisk: 0,
        repetitionPenalty: 0,
      }),
    ).toBe(0);
  });

  it("soma os fatores e corta em 100", () => {
    expect(
      candidateScore({
        hardFilterPass: true,
        preferenceFit: 25,
        intentFit: 20,
        interestSimilarity: 15,
        freshness: 10,
        reciprocalProbability: 10,
        trustQuality: 10,
        explorationBonus: 10,
        safetyRisk: 5,
        repetitionPenalty: 0,
      }),
    ).toBe(95);
  });
});

describe("hardFilter", () => {
  const base = {
    age: 30,
    minAge: 26,
    maxAge: 36,
    gender: "mulher",
    wantedGender: "mulher",
    intent: "serio",
    wantedIntent: "serio",
    distanceRank: 0,
    maxDistanceRank: 1,
    blocked: false,
  };

  it("recusa bloqueio, idade e distância", () => {
    expect(hardFilter({ ...base, blocked: true })).toBe(false);
    expect(hardFilter({ ...base, age: 20 })).toBe(false);
    expect(hardFilter({ ...base, distanceRank: 2 })).toBe(false);
  });
});

describe("distância e par", () => {
  it("mostra faixa e nunca um número de metros", () => {
    expect(distanceLabel("sao-paulo:pinheiros", "sao-paulo:pinheiros")).toBe("menos de 5 km");
    expect(distanceRank("sao-paulo:pinheiros", "campinas:cambui")).toBe(2);
    expect(distanceLabel("sao-paulo:pinheiros", "sao-paulo:moema")).toBe("menos de 15 km");
  });

  it("ordena o par e reconhece participante", () => {
    expect(orderedPair("b", "a")).toEqual(["a", "b"]);
    expect(isParticipant("a", "a", "b")).toBe(true);
    expect(isParticipant("c", "a", "b")).toBe(false);
  });
});

describe("sinais de conversa", () => {
  it("marca pedido de Pix e convite para sair do app", () => {
    expect(messageHasRiskHint("me chama no whatsapp")).toBe(true);
    expect(messageHasRiskHint("sábado no parque")).toBe(false);
  });
});

describe("idade e dia em São Paulo", () => {
  it("calcula idade e recusa data impossível", () => {
    expect(ageFromBirthDate("1996-01-02", new Date("2026-09-22T12:00:00Z"))).toBe(30);
    expect(ageFromBirthDate("1996-13-02")).toBeNull();
  });

  it("usa a data de São Paulo perto da meia-noite UTC", () => {
    expect(saoPauloDate(new Date("2026-09-23T02:30:00Z"))).toBe("2026-09-22");
  });
});

describe("perfil público", () => {
  it("não inclui senha nem coordenada", () => {
    expect(discoveryProfileFields).not.toContain("passwordHash");
    expect(discoveryProfileFields).not.toContain("latitude");
  });
});
