import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorNote, Shell } from "@/components/Shell";
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
      <h1>{otherName}</h1>
      <ErrorNote message={erro} />
      {starters.length > 0 ? (
        <section aria-label="Para começar">
          <p className="meta">Para começar, se quiser:</p>
          <ul>
            {starters.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {loaded.match.messages.map((message) => (
          <li key={message.id} style={{ marginBottom: "0.8rem" }}>
            <p style={{ margin: 0 }}>{message.body || "Mensagem removida."}</p>
            {message.riskHint ? (
              <p className="hint">
                Essa mensagem pede Pix, cripto ou outro app. Combine o encontro aqui e não envie dinheiro.
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {loaded.match.closedAt ? (
        <p>Conversa encerrada. A denúncia continua disponível.</p>
      ) : (
        <form action="/api/conversa" method="post">
          <input type="hidden" name="matchId" value={loaded.match.id} />
          <input type="hidden" name="voltar" value={`/conversas/${loaded.match.id}`} />
          <label>
            Mensagem
            <textarea name="body" required maxLength={1000} rows={3} />
          </label>
          <p>
            <button type="submit" name="acao" value="mensagem">
              Enviar
            </button>
          </p>
        </form>
      )}
      <p>
        <Link className="button persimmon" href={`/encontro/${loaded.match.id}`}>
          Quero encontrar
        </Link>
      </p>
      <form action="/api/seguranca" method="post">
        <input type="hidden" name="alvo" value={loaded.otherId} />
        <input type="hidden" name="matchId" value={loaded.match.id} />
        <input type="hidden" name="chave" value={key} />
        <input type="hidden" name="voltar" value="/conversas" />
        <label>
          O que aconteceu
          <textarea name="motivo" rows={3} />
        </label>
        <p style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <button type="submit" name="acao" value="denunciar">
            Denunciar
          </button>
          <button type="submit" name="acao" value="bloquear">
            Bloquear
          </button>
          <button type="submit" name="acao" value="encerrar">
            Encerrar conversa
          </button>
        </p>
      </form>
    </Shell>
  );
}
