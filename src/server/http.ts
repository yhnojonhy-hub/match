import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/server/session";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) {
    throw new HttpError(403, "Origem ausente.");
  }
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, "Origem inválida.");
  }
  if (originHost !== host) {
    throw new HttpError(403, "Origem recusada.");
  }
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 20_000) {
    throw new HttpError(413, "Pedido grande demais.");
  }
}

export function redirectTo(request: Request, path: string, error?: string) {
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("erro", error);
  return NextResponse.redirect(url, 303);
}

export function withSession(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

export function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}

export async function readForm(request: Request) {
  assertSameOrigin(request);
  return request.formData();
}

export function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function safePath(value: string, fallback = "/"): string {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export async function handlePost(
  request: Request,
  run: (form: FormData, back: string) => Promise<NextResponse | void>,
  fallback = "/",
) {
  let back = fallback;
  try {
    const form = await readForm(request);
    back = safePath(text(form, "voltar") || fallback, fallback);
    const response = await run(form, back);
    return response ?? redirectTo(request, back);
  } catch (error) {
    const message = error instanceof HttpError ? error.message : "Não deu para concluir.";
    return redirectTo(request, back, message);
  }
}
