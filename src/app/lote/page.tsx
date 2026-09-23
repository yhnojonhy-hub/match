import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, ErrorNote, Shell, initialsOf } from "@/components/Shell";
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
        <p>
          <Link className="button sun" href="/perfil">
            Ir para o perfil
          </Link>
        </p>
      </Shell>
    );
  }
  const likedYou = await incomingLikes(user.id);
  const card = batch.cards[0];
  const key = crypto.randomUUID();
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const today = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  return (
    <Shell signedIn admin={user.role === "admin"}>
      <div className="daybar">
        <strong>{today}</strong>
        <span className="meta">
          {batch.remaining} de {batch.total} na pilha · plano {batch.plan === "plus" ? "Plus" : "gratuito"}
        </span>
      </div>
      <ErrorNote message={erro} />
      <div className="lote">
        {card ? (
          <div>
            <article className="person">
              {card.photoName ? (
                <img src={`/foto/${card.userId}`} alt={`Foto de ${card.displayName}`} />
              ) : (
                <span className="initials" aria-hidden="true">
                  {initialsOf(card.displayName)}
                </span>
              )}
              <span className="chip">{card.distance}</span>
              <div className="name">
                <h2>
                  {card.displayName}, {card.age}
                </h2>
                <p>{intentLabel(card.intent)}</p>
              </div>
            </article>
            <form action="/api/lote" method="post" className="actions" style={{ maxWidth: "none" }}>
              <input type="hidden" name="alvo" value={card.userId} />
              <input type="hidden" name="chave" value={key} />
              <input type="hidden" name="voltar" value="/lote" />
              <button type="submit" name="acao" value="passar" style={{ flex: 1, justifyContent: "center" }}>
                Passar
              </button>
              <button type="submit" name="acao" value="sinal" className="sun" style={{ flex: 2, justifyContent: "center" }}>
                Quero conhecer
              </button>
            </form>
          </div>
        ) : (
          <div className="person" style={{ background: "#dfe3ea", color: "var(--color-ink)", boxShadow: "none" }}>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: "2rem", textAlign: "center" }}>
              <div>
                <h2 style={{ marginBottom: "0.4rem" }}>O lote de hoje acabou.</h2>
                <p className="meta" style={{ margin: 0 }}>
                  Amanhã, à meia-noite de São Paulo, entra um grupo novo.
                </p>
              </div>
            </div>
          </div>
        )}
        <aside>
          {card ? (
            <>
              <h2 style={{ marginTop: 0 }}>Sobre {card.displayName}</h2>
              <p>{card.bio || "Ainda sem texto no perfil."}</p>
              {card.interests ? (
                <p className="meta">
                  Interesses: {card.interests}
                </p>
              ) : null}
            </>
          ) : null}
          {batch.likeLimit !== null ? (
            <p className="meta" style={{ marginTop: "1.5rem" }}>
              Sinais hoje: {batch.likesToday} de {batch.likeLimit}.{" "}
              <Link href="/plus">O Plus tira o limite.</Link>
            </p>
          ) : null}
          {likedYou.length > 0 ? (
            <section>
              <h2>Quem sinalizou você</h2>
              <ul className="list">
                {likedYou.map((person) => (
                  <li key={person.userId}>
                    <div className="row">
                      <Avatar userId={person.userId} name={person.displayName} hasPhoto={Boolean(person.photoName)} />
                      <div className="who">
                        <strong>{person.displayName}</strong>
                        <span>{person.age} anos</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </Shell>
  );
}

function intentLabel(intent: string) {
  if (intent === "serio") return "procura algo sério";
  if (intent === "casual") return "procura algo casual";
  return "procura amizade";
}
