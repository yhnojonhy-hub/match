import { activatePlus } from "@/server/actions";
import { handlePost, HttpError, text } from "@/server/http";
import { currentUser } from "@/server/session";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Entre para continuar.");
    await activatePlus(user.id, text(form, "chave"));
  }, "/plus");
}
