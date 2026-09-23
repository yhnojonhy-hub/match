"use client";

import { Player } from "@remotion/player";
import { ProductFilm } from "@/components/ProductFilm";

export function FilmPlayer() {
  return (
    <Player
      component={ProductFilm}
      durationInFrames={150}
      compositionWidth={720}
      compositionHeight={360}
      fps={30}
      style={{ width: "100%", border: "1px solid #1c2430" }}
      acknowledgeRemotionLicense
    />
  );
}
