import Link from "next/link";
import { Shell } from "@/components/Shell";

const PILE = [
  { name: "Caio, 32", note: "Corre no parque de manhã. Trilha.", distance: "até 5 km", src: "/seed/caio.jpg" },
  { name: "Helena, 31", note: "Lê no fim da tarde. Vila Madalena.", distance: "até 5 km", src: "/seed/helena.jpg" },
  { name: "Marina, 29", note: "Café, trilha e cinema. Pinheiros.", distance: "menos de 2 km", src: "/seed/marina.jpg" },
];

export default function HomePage() {
  return (
    <Shell>
      <section className="hero">
        <div>
          <h1>O lote de hoje acaba.</h1>
          <p className="lead">
            Todo dia, um grupo curto de pessoas dentro da idade, da distância e da intenção que você marcou. Quando o
            grupo acaba, a pilha fecha até amanhã.
          </p>
          <p className="actions">
            <Link className="button sun" href="/cadastrar">
              Criar conta
            </Link>
            <Link className="button" href="/entrar">
              Já tenho conta
            </Link>
          </p>
          <p className="meta" style={{ fontSize: "0.9rem" }}>
            São Paulo, 18 anos ou mais. A conferência de idade desta versão é simulada e não substitui um provedor.
          </p>
        </div>
        <div className="pile" aria-hidden="true">
          {PILE.map((card) => (
            <div className="person" key={card.name}>
              <img src={card.src} alt="" />
              <span className="chip">{card.distance}</span>
              <div className="name">
                <h2>{card.name}</h2>
                <p>{card.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="ticket" aria-label="Como funciona">
        <p>
          Um lote por dia. A conversa só abre quando os dois sinalizam. O encontro fica em lugar público, com um texto
          pronto para avisar alguém de confiança.
        </p>
      </section>
    </Shell>
  );
}
