import { NextResponse } from "next/server";
import { eraseAccount } from "@/server/actions";
import { clearSession, handlePost, HttpError } from "@/server/http";
import { currentUser, destroySession, SESSION_COOKIE } from "@/server/session";

export async function POST(request: Request) {
  return handlePost(request, async () => {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Entre para continuar.");
    const cookie = request.headers.get("cookie") ?? "";
    const token = cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1);
    await eraseAccount(user.id);
    await destroySession(token ? decodeURIComponent(token) : undefined);
    return clearSession(NextResponse.redirect(new URL("/", request.url), 303));
  }, "/perfil");
}
