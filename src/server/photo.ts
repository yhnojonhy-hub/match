import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { photoRejection } from "@/domain/sniff";
import { HttpError } from "@/server/http";

const PHOTO_NAME = /^[a-f0-9]{32}\.jpg$/;
const dir = () => path.join(process.cwd(), "storage");

export function photoPath(name: string): string {
  if (!PHOTO_NAME.test(name)) throw new HttpError(404, "Foto ausente.");
  return path.join(dir(), name);
}

// Redimensiona para caber em 1200px, endireita pela orientação e descarta
// todos os metadados (GPS, câmera, data). Entra JPEG, PNG ou WebP; sai JPEG.
export async function storePhoto(bytes: Uint8Array, declaredType = ""): Promise<string> {
  const reason = photoRejection(bytes, declaredType);
  if (reason) throw new HttpError(400, reason);
  let output: Buffer;
  try {
    output = await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();
  } catch {
    throw new HttpError(400, "Não deu para ler essa imagem.");
  }
  const name = `${randomBytes(16).toString("hex")}.jpg`;
  await mkdir(dir(), { recursive: true });
  await writeFile(path.join(dir(), name), output);
  return name;
}

export async function removePhoto(name: string): Promise<void> {
  if (!PHOTO_NAME.test(name)) return;
  await rm(path.join(dir(), name), { force: true });
}

export async function readPhoto(name: string): Promise<Buffer> {
  try {
    return await readFile(photoPath(name));
  } catch {
    throw new HttpError(404, "Foto ausente.");
  }
}
