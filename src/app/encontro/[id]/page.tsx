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
  const windows = await countWindows(loaded.match.id);

  return (
    <Shell signedIn admin={user.role === "admin"}>
      <h1>Encontro com {loaded.other?.displayName}</h1>
      <ErrorNote message={erro} />
      <p>O lugar fica público. Endereço de casa não entra aqui.</p>
      {!loaded.want.theirs ? (
        <form action="/api/encontro" method="post">
          <input type="hidden" name="matchId" value={loaded.match.id} />
          <input type="hidden" name="voltar" value={`/encontro/${loaded.match.id}`} />
          <p>{loaded.want.mine ? "Seu sinal já está guardado. O da outra pessoa ainda não." : "Os dois precisam marcar."}</p>
          <button className="persimmon" type="submit" name="acao" value="quero">
            Quero encontrar
          </button>
        </form>
      ) : (
        <>
          <form action="/api/encontro" method="post">
            <input type="hidden" name="matchId" value={loaded.match.id} />
            <input type="hidden" name="voltar" value={`/encontro/${loaded.match.id}`} />
            <label>
              Sua janela
              <select name="janela" defaultValue="sábado à tarde">
                <option>sábado à tarde</option>
                <option>domingo de manhã</option>
                <option>quarta depois do trabalho</option>
              </select>
            </label>
            <p>
              <button type="submit" name="acao" value="janela">
                Guardar janela
              </button>
            </p>
          </form>
          {windows >= 2 ? (
            <form action="/api/encontro" method="post">
              <input type="hidden" name="matchId" value={loaded.match.id} />
              <input type="hidden" name="voltar" value={`/encontro/${loaded.match.id}`} />
              <label>
                Lugar público
                <input name="lugar" defaultValue={loaded.match.plan?.placeName ?? "café na região"} required />
              </label>
              <p>
                <button className="persimmon" type="submit" name="acao" value="lugar">
                  Marcar o lugar
                </button>
              </p>
            </form>
          ) : (
            <p className="meta">Quando as duas janelas existirem, o lugar pode ser marcado.</p>
          )}
          {loaded.match.plan ? (
            <>
              <p>
                Encontro marcado: {loaded.match.plan.placeName}. {loaded.match.plan.whenLabel}
              </p>
              <section aria-label="Avise alguém">
                <p className="meta">Copie e mande para alguém de confiança. O Match não envia isso por você.</p>
                <textarea
                  readOnly
                  rows={3}
                  aria-label="Texto para a pessoa de confiança"
                  defaultValue={trustedContactNote({
                    otherName: loaded.other?.displayName ?? "a pessoa",
                    placeName: loaded.match.plan.placeName,
                    whenLabel: loaded.match.plan.whenLabel,
                  })}
                />
              </section>
            </>
          ) : null}
        </>
      )}
    </Shell>
  );
}

async function countWindows(matchId: string) {
  const { db } = await import("@/server/db");
  return db.availability.count({ where: { matchId } });
}
