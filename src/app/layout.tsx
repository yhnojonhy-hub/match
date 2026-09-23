import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: "Match — o lote de hoje",
  description: "Um grupo curto de pessoas por dia, em São Paulo, e um caminho até um encontro em lugar público.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={bricolage.variable}>
      <body>{children}</body>
    </html>
  );
}
