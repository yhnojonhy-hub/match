import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { HttpError } from "@/server/http";
import { readPhoto } from "@/server/photo";
import { currentUser } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Só quem está dentro vê fotos. Quem foi bloqueado não vê a foto de quem bloqueou.
export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const viewer = await currentUser();
  if (!viewer) return new NextResponse("Entre para continuar.", { status: 401 });
  const { userId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return new NextResponse("Foto ausente.", { status: 404 });
  const blocked = await db.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: viewer.id },
        { blockerId: viewer.id, blockedId: userId },
      ],
    },
  });
  if (blocked) return new NextResponse("Foto ausente.", { status: 404 });
  const profile = await db.profile.findUnique({ where: { userId }, select: { photoName: true } });
  if (!profile?.photoName) return new NextResponse("Foto ausente.", { status: 404 });
  try {
    const bytes = await readPhoto(profile.photoName);
    return new NextResponse(new Uint8Array(bytes), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    if (error instanceof HttpError) return new NextResponse(error.message, { status: error.status });
    throw error;
  }
}
