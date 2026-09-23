import Link from "next/link";
import { FilmGate } from "@/components/FilmGate";
import { Shell } from "@/components/Shell";

export default function HomePage() {
  return (
    <Shell>
      <p className="meta">São Paulo · 18+</p>
      <h1 className="arrive" style={{ fontSize: "clamp(3rem, 8vw, 5.4rem)", maxWidth: "12ch" }}>
        O lote de hoje acaba.
      </h1>
      <p style={{ maxWidth: "38rem" }}>
        Cada dia traz um grupo curto de pessoas dentro da idade, da distância e da intenção que você marcou.
        Quando o grupo acaba, a pilha acaba. O plano gratuito já inclui conversa, denúncia e bloqueio.
      </p>
      <FilmGate />
      <p>
        <Link className="button" href="/cadastrar">
          Criar conta
        </Link>
      </p>
      <p className="meta">A conferência de idade desta versão é simulada. Ela não substitui um provedor.</p>
    </Shell>
  );
}
