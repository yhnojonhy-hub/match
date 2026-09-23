import { db } from "@/server/db";
import { handlePost, HttpError, text } from "@/server/http";
import { currentUser } from "@/server/session";

export async function POST(request: Request) {
  return handlePost(request, async (form) => {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Entre para continuar.");
    const minAge = Number(text(form, "minAge"));
    const maxAge = Number(text(form, "maxAge"));
    if (minAge < 18 || maxAge < minAge) throw new HttpError(400, "A faixa de idade começa em 18.");
    await db.profile.update({
      where: { userId: user.id },
      data: {
        displayName: text(form, "displayName"),
        bio: text(form, "bio"),
        interests: text(form, "interests"),
        intent: text(form, "intent"),
      },
    });
    await db.preference.update({
      where: { userId: user.id },
      data: {
        gender: text(form, "wantedGender"),
        minAge,
        maxAge,
        maxDistance: text(form, "maxDistance"),
        intent: text(form, "intent"),
      },
    });
  }, "/perfil");
}
