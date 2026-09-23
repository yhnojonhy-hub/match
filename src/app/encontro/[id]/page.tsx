import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorNote, Shell } from "@/components/Shell";
import { trustedContactNote } from "@/domain/starters";
import { loadMatch } from "@/server/actions";
import { HttpError } from "@/server/http";
import { currentUser } from "@/server/session";

export default async function DatePage({
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
  const windows = loaded.match.windows.length;
  const otherName = loaded.other?.displayName ?? "a pessoa";
  const back = `/encontro/${loaded.match.id}`;

  return (
    <Shell signedIn admin={user.role === "admin"}>
      <p style={{ margin: 0 }}>
        <Link href={`/conversas/${loaded.match.id}`} className="meta">
          Voltar para a conversa
        </Link>
      </p>
      <h1>Encontro com {otherName}</h1>
      <p className="meta">O lugar fica público. Endereço de casa não entra aqui.</p>
      <ErrorNote message={erro} />
      {!loaded.want.theirs ? (
        <form action="/api/encontro" method="post">
          <input type="hidden" name="matchId" value={loaded.match.id} />
          <input type="hidden" name="voltar" value={back} />
          <p>
            {loaded.want.mine
              ? `Seu sinal está guardado. Falta ${otherName} marcar também.`
              : "Os dois precisam marcar que querem se encontrar."}
          </p>
          {loaded.want.mine ? null : (
            <button className="sun" type="submit" name="acao" value="quero">
              Quero encontrar
            </button>
          )}
        </form>
      ) : (
        <>
          <form action="/api/encontro" method="post">
            <input type="hidden" name="matchId" value={loaded.match.id} />
            <input type="hidden" name="voltar" value={back} />
            <label>
              Sua janela
              <span className="help">Quando as duas janelas existirem, o lugar pode ser marcado.</span>
              <select name="janela" defaultValue="sábado à tarde">
                <option>sábado à tarde</option>
                <option>domingo de manhã</option>
                <option>quarta depois do trabalho</option>
              </select>
            </label>
            <p className="actions">
              <button type="submit" name="acao" value="janela">
                Guardar janela
              </button>
            </p>
          </form>
          {windows >= 2 ? (
            <form action="/api/encontro" method="post">
              <input type="hidden" name="matchId" value={loaded.match.id} />
              <input type="hidden" name="voltar" value={back} />
              <label>
                Lugar público
                <input name="lugar" defaultValue={loaded.match.plan?.placeName ?? ""} placeholder="café, praça, livraria" required />
              </label>
              <p className="actions">
                <button className="sun" type="submit" name="acao" value="lugar">
                  Marcar o lugar
                </button>
              </p>
            </form>
          ) : null}
          {loaded.match.plan ? (
            <section className="plan current" style={{ marginTop: "2rem" }}>
              <h2 style={{ marginTop: 0 }}>Marcado</h2>
              <p>
                {loaded.match.plan.placeName}. {loaded.match.plan.whenLabel}.
              </p>
              <label>
                Avise alguém de confiança
                <span className="help">Copie e mande. O Match não envia isso por você.</span>
                <textarea
                  readOnly
                  rows={3}
                  defaultValue={trustedContactNote({
                    otherName,
                    placeName: loaded.match.plan.placeName,
                    whenLabel: loaded.match.plan.whenLabel,
                  })}
                />
              </label>
            </section>
          ) : null}
        </>
      )}
    </Shell>
  );
}
