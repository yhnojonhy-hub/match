import { markWant, savePlace, saveWindow } from "@/server/actions";
import { handlePost, HttpError, text } from "@/server/http";
import { currentUser } from "@/server/session";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Entre para continuar.");
    const matchId = text(form, "matchId");
    const acao = text(form, "acao");
    if (acao === "quero") await markWant(user.id, matchId);
    if (acao === "janela") await saveWindow(user.id, matchId, text(form, "janela"));
    if (acao === "lugar") await savePlace(user.id, matchId, text(form, "lugar"));
  }, "/conversas");
}
