import { db } from "@/server/db";
import { handlePost, HttpError, text } from "@/server/http";
import { removePhoto, storePhoto } from "@/server/photo";
import { currentUser } from "@/server/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handlePost(
    request,
    async (form) => {
      const user = await currentUser();
      if (!user?.profile) throw new HttpError(401, "Entre para continuar.");
      const previous = user.profile.photoName;
      if (text(form, "acao") === "remover") {
        await db.profile.update({ where: { userId: user.id }, data: { photoName: "" } });
        if (previous) await removePhoto(previous);
        return;
      }
      const file = form.get("foto");
      if (!(file instanceof File)) throw new HttpError(400, "Escolha uma foto antes de enviar.");
      const name = await storePhoto(new Uint8Array(await file.arrayBuffer()), file.type);
      await db.profile.update({ where: { userId: user.id }, data: { photoName: name } });
      if (previous) await removePhoto(previous);
    },
    "/perfil",
    6_500_000,
  );
}
