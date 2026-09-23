"use client";

import dynamic from "next/dynamic";

export const FilmGate = dynamic(() => import("@/components/FilmPlayer").then((mod) => mod.FilmPlayer), {
  ssr: false,
});
