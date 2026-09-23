import { db } from "@/server/db";
import { registerUser } from "@/server/actions";
import { handlePost, redirectTo, text, withSession } from "@/server/http";
import { storePhoto } from "@/server/photo";
import { createSession } from "@/server/session";

export async function POST(request: Request) {
  return handlePost(
    request,
    async (form) => {
      const user = await registerUser({
        email: text(form, "email"),
        password: text(form, "password"),
        displayName: text(form, "displayName"),
        birthDate: text(form, "birthDate"),
        intent: text(form, "intent"),
        gender: text(form, "gender"),
        gridCell: text(form, "gridCell"),
      });
      const file = form.get("foto");
      let hasPhoto = false;
      if (file instanceof File && file.size > 0) {
        const name = await storePhoto(new Uint8Array(await file.arrayBuffer()), file.type);
        await db.profile.update({ where: { userId: user.id }, data: { photoName: name } });
        hasPhoto = true;
      }
      const token = await createSession(user.id);
      return withSession(redirectTo(request, hasPhoto ? "/lote" : "/perfil"), token);
    },
    "/cadastrar",
    6_500_000,
  );
}
