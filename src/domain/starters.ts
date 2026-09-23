// Puxadores de conversa: 2 a 3 frases a partir do que as duas pessoas
// declararam. Sem nota de beleza, sem probabilidade. Só um começo.

export function splitInterests(raw: string): string[] {
  return [...new Set(raw.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean))];
}

export function commonInterests(mine: string, theirs: string): string[] {
  const theirSet = new Set(splitInterests(theirs));
  return splitInterests(mine).filter((item) => theirSet.has(item));
}

const FALLBACK = [
  "O que você anda fazendo nos fins de semana?",
  "Qual lugar de São Paulo você levaria alguém que nunca veio?",
  "O que você quer fazer que ainda não fez este ano?",
];

export function conversationStarters(mine: string, theirs: string, otherName: string): string[] {
  const shared = commonInterests(mine, theirs);
  const lines = shared.slice(0, 2).map((interest, index) =>
    index === 0
      ? `Vocês dois marcaram ${interest}. Como isso entrou na sua vida, ${otherName}?`
      : `Também têm ${interest} em comum. Qual foi a última vez que você fez isso?`,
  );
  for (const fallback of FALLBACK) {
    if (lines.length >= 3) break;
    lines.push(fallback);
  }
  return lines;
}

export function trustedContactNote(input: {
  otherName: string;
  placeName: string;
  whenLabel: string;
}): string {
  return [
    `Vou encontrar ${input.otherName}, que conheci pelo Match.`,
    `Lugar: ${input.placeName}. Quando: ${input.whenLabel}.`,
    "Se eu não der notícia até duas horas depois, me liga.",
  ].join(" ");
}
