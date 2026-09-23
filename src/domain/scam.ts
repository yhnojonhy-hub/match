const HINT =
  /pix|cripto|crypto|bitcoin|usdt|whatsapp|telegram|sai do app|me passa seu|investimento/i;

export function messageHasRiskHint(body: string): boolean {
  return HINT.test(body);
}
