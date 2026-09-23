import { redirect } from "next/navigation";
import { Shell, ErrorNote } from "@/components/Shell";
import { incomingLikes, visibleBatch } from "@/server/actions";
import { currentUser } from "@/server/session";

export default async function BatchPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  const { erro } = await searchParams;
  let batch: Awaited<ReturnType<typeof visibleBatch>>;
  try {
    batch = await visibleBatch(user.id);
  } catch {
    return (
      <Shell signedIn admin={user.role === "admin"}>
        <h1>Complete o perfil</h1>
        <p>O lote usa idade, intenção e bairro. Sem isso a pilha não abre.</p>
      </Shell>
    );
  }
  const likedYou = await incomingLikes(user.id);
  const card = batch.cards[0];
  const key = crypto.randomUUID();

  return (
    <Shell signedIn admin={user.role === "admin"}>
      <p className="meta">
        Lote de hoje · {batch.remaining} de {batch.total} · plano {batch.plan}
      </p>
      <h1>Quem ainda está na pilha</h1>
      <ErrorNote message={erro} />
      {card ? (
        <article className="card">
          <p className="meta">{card.distance}</p>
          <h2 style={{ fontSize: "2.4rem", margin: "0.2rem 0" }}>{card.displayName}</h2>
          <p>
            {card.age} anos · {intentLabel(card.intent)}
          </p>
          <p>{card.bio || "Sem bio ainda."}</p>
          {card.interests ? <p className="meta">{card.interests}</p> : null}
          <form action="/api/lote" method="post" style={{ display: "flex", gap: "0.8rem" }}>
            <input type="hidden" name="alvo" value={card.userId} />
            <input type="hidden" name="chave" value={key} />
            <input type="hidden" name="voltar" value="/lote" />
            <button type="submit" name="acao" value="passar">
              Passar
            </button>
            <button type="submit" name="acao" value="sinal">
              Quero conhecer
            </button>
          </form>
        </article>
      ) : (
        <p>O lote de hoje acabou.</p>
      )}
      {batch.likeLimit !== null ? (
        <p className="meta">
          Sinais hoje: {batch.likesToday} de {batch.likeLimit}.
        </p>
      ) : null}
      {likedYou.length > 0 ? (
        <section>
          <h2>Quem sinalizou você</h2>
          <ul>
            {likedYou.map((person) => (
              <li key={person.userId}>{person.displayName}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </Shell>
  );
}

function intentLabel(intent: string) {
  if (intent === "serio") return "algo sério";
  if (intent === "casual") return "algo casual";
  return "amizade";
}
