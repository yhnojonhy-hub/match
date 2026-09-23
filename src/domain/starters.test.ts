import { describe, expect, it } from "vitest";
import { commonInterests, conversationStarters, trustedContactNote } from "./starters";

describe("puxadores de conversa", () => {
  it("usa os interesses em comum primeiro", () => {
    const lines = conversationStarters("Cinema, corrida, café", "café, CINEMA, jazz", "Bia");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("cinema");
    expect(lines[0]).toContain("Bia");
    expect(lines[1]).toContain("café");
  });

  it("completa com frases genéricas quando não há nada em comum", () => {
    const lines = conversationStarters("xadrez", "surfe", "Léo");
    expect(lines).toHaveLength(3);
    expect(lines.join(" ")).not.toContain("xadrez");
  });

  it("não repete interesse duplicado", () => {
    expect(commonInterests("café, café", "café")).toEqual(["café"]);
  });

  it("monta o texto para a pessoa de confiança", () => {
    const note = trustedContactNote({ otherName: "Bia", placeName: "Café Girondino", whenLabel: "sábado à tarde" });
    expect(note).toContain("Café Girondino");
    expect(note).toContain("sábado à tarde");
    expect(note).not.toContain("http");
  });
});
