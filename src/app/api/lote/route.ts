import { sendLike, sendPass } from "@/server/actions";
import { handlePost, text } from "@/server/http";
import { currentUser } from "@/server/session";
import { HttpError } from "@/server/http";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Entre para continuar.");
    const alvo = text(form, "alvo");
    const chave = text(form, "chave");
    if (text(form, "acao") === "passar") await sendPass(user.id, alvo, chave);
    else await sendLike(user.id, alvo, chave);
  }, "/lote");
}
