import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, ErrorNote, Shell } from "@/components/Shell";
import { conversationStarters } from "@/domain/starters";
import { loadMatch } from "@/server/actions";
import { currentUser } from "@/server/session";
import { HttpError } from "@/server/http";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  const { id } = await params;
  const { erro } = await searchParams;
  let loaded: Awaited<ReturnType<typeof loadMatch>>;
  try {
    loaded = await loadMatch(user.id, id);
  } catch (error) {
    if (error instanceof HttpError) redirect("/conversas");
    throw error;
  }
  const key = crypto.randomUUID();
  const otherName = loaded.other?.displayName ?? "Conversa";
  const starters =
    loaded.match.messages.length === 0 && !loaded.match.closedAt
      ? conversationStarters(loaded.myInterests, loaded.other?.interests ?? "", otherName)
      : [];

  return (
    <Shell signedIn admin={user.role === "admin"}>
      <p style={{ margin: 0 }}>
        <Link href="/conversas" className="meta">
          Conversas
        </Link>
      </p>
      <div className="row" style={{ padding: "0.4rem 0 1rem" }}>
        <Avatar userId={loaded.otherId} name={otherName} hasPhoto={Boolean(loaded.other?.photoName)} />
        <div className="who">
          <h1 style={{ margin: 0, fontSize: "1.7rem" }}>{otherName}</h1>
          {loaded.other ? (
            <span>
              {loaded.other.age} anos · {loaded.other.interests || "sem interesses listados"}
            </span>
          ) : null}
        </div>
        <Link className="button sun" href={`/encontro/${loaded.match.id}`}>
          Quero encontrar
        </Link>
      </div>
      <ErrorNote message={erro} />
      {starters.length > 0 ? (
        <section className="starters" aria-label="Para começar">
          <strong>Para começar, se quiser:</strong>
          <ul>
            {starters.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <ul className="thread">
        {loaded.match.messages.map((message) => (
          <li key={message.id} className={message.senderId === user.id ? "mine" : undefined}>
            <p>{message.body || "Mensagem removida."}</p>
            {message.riskHint ? (
              <p className="hint" style={{ marginTop: "0.5rem", color: "var(--color-ink)" }}>
                Essa mensagem pede Pix, cripto ou outro app. Combine o encontro aqui e não envie dinheiro.
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {loaded.match.closedAt ? (
        <p className="meta">Conversa encerrada. A denúncia continua disponível.</p>
      ) : (
        <form action="/api/conversa" method="post" style={{ maxWidth: "40rem" }}>
          <input type="hidden" name="matchId" value={loaded.match.id} />
          <input type="hidden" name="voltar" value={`/conversas/${loaded.match.id}`} />
          <label>
            Mensagem
            <textarea name="body" required maxLength={1000} rows={3} placeholder={`Escreva para ${otherName}`} />
          </label>
          <p className="actions">
            <button type="submit" name="acao" value="mensagem" className="sun">
              Enviar
            </button>
          </p>
        </form>
      )}
      <details style={{ marginTop: "2.5rem", maxWidth: "40rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Segurança: denunciar, bloquear ou encerrar</summary>
        <form action="/api/seguranca" method="post">
          <input type="hidden" name="alvo" value={loaded.otherId} />
          <input type="hidden" name="matchId" value={loaded.match.id} />
          <input type="hidden" name="chave" value={key} />
          <input type="hidden" name="voltar" value="/conversas" />
          <label>
            O que aconteceu
            <span className="help">Opcional para bloquear e encerrar. Ajuda a equipe a decidir na denúncia.</span>
            <textarea name="motivo" rows={3} />
          </label>
          <p className="actions">
            <button type="submit" name="acao" value="denunciar" className="danger">
              Denunciar
            </button>
            <button type="submit" name="acao" value="bloquear">
              Bloquear
            </button>
            <button type="submit" name="acao" value="encerrar" className="quiet">
              Encerrar conversa
            </button>
          </p>
        </form>
      </details>
    </Shell>
  );
}
