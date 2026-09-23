import { registerUser } from "@/server/actions";
import { handlePost, redirectTo, text, withSession } from "@/server/http";
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
      const token = await createSession(user.id);
      return withSession(redirectTo(request, "/lote"), token);
    },
    "/cadastrar",
  );
}
