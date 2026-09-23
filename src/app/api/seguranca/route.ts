import { blockPerson, closeMatch, reportPerson } from "@/server/actions";
import { handlePost, HttpError, text } from "@/server/http";
import { currentUser } from "@/server/session";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Entre para continuar.");
    const acao = text(form, "acao");
    const matchId = text(form, "matchId");
    if (acao === "denunciar") {
      await reportPerson({
        reporterId: user.id,
        targetId: text(form, "alvo"),
        matchId,
        reason: text(form, "motivo"),
      });
    }
    if (acao === "bloquear") await blockPerson(user.id, text(form, "alvo"));
    if (acao === "encerrar") await closeMatch(user.id, matchId);
  }, "/conversas");
}
