import { NextResponse } from "next/server";
import { clearSession, handlePost } from "@/server/http";
import { destroySession, SESSION_COOKIE } from "@/server/session";

export async function POST(request: Request) {
  return handlePost(request, async () => {
    const cookie = request.headers.get("cookie") ?? "";
    const token = cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1);
    await destroySession(token ? decodeURIComponent(token) : undefined);
    return clearSession(NextResponse.redirect(new URL("/", request.url), 303));
  });
}
