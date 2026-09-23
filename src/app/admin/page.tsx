import { redirect } from "next/navigation";
import { ErrorNote, Shell } from "@/components/Shell";
import { adminHome } from "@/server/actions";
import { currentUser } from "@/server/session";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  if (user.role !== "admin") redirect("/lote");
  const { erro } = await searchParams;
  const data = await adminHome();
  return (
    <Shell signedIn admin>
      <h1>Fila</h1>
      <ErrorNote message={erro} />
      <p className="meta">
        Lotes {data.funnel.impressions} · sinais {data.funnel.likes} · matches {data.funnel.matches} · mensagens{" "}
        {data.funnel.messages} · encontros {data.funnel.plans}
      </p>
      {data.reports.length === 0 ? <p>Nenhuma denúncia aberta.</p> : null}
      {data.reports.map((report) => (
        <article className="card" key={report.id} style={{ marginBottom: "1rem" }}>
          <p>{report.reason}</p>
          <p className="meta">Mensagens guardadas: {report.messageIds || "nenhuma"}</p>
          <form action="/api/admin" method="post">
            <input type="hidden" name="reportId" value={report.id} />
            <input type="hidden" name="voltar" value="/admin" />
            <label>
              Motivo da revisão
              <input name="motivo" required />
            </label>
            <p>
              <button type="submit">Marcar como revista</button>
            </p>
          </form>
        </article>
      ))}
    </Shell>
  );
}
