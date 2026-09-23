import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const ProductFilm = () => {
  const frame = useCurrentFrame();
  const title = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const line = interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const left = Math.max(0, 8 - Math.floor(frame / 18));

  return (
    <AbsoluteFill style={{ background: "#f3ede4", color: "#1c2430", fontFamily: "Georgia, serif", padding: 48 }}>
      <div style={{ opacity: title, fontSize: 64, lineHeight: 1, maxWidth: 520 }}>O lote de hoje acaba.</div>
      <div style={{ opacity: line, marginTop: 28, fontFamily: "sans-serif", fontSize: 28 }}>
        Restam {left} pessoas na pilha.
      </div>
    </AbsoluteFill>
  );
};
