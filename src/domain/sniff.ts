export const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

export function sniffImage(bytes: Uint8Array): "jpeg" | "png" | "webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

export function photoRejection(bytes: Uint8Array, declaredType = ""): string | null {
  if (bytes.length === 0) return "Escolha uma foto antes de enviar.";
  if (bytes.length > MAX_PHOTO_BYTES) return "A foto passa de 6 MB.";
  if (declaredType === "image/svg+xml") return "SVG não entra.";
  if (!sniffImage(bytes)) return "Envie uma foto em JPEG, PNG ou WebP.";
  return null;
}
