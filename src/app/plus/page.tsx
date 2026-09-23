import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { currentUser } from "@/server/session";

export default async function PlusPage() {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  const plus = (user.subscription?.plan ?? "free") === "plus";
  return (
    <Shell signedIn admin={user.role === "admin"}>
      <h1>Planos</h1>
      <p className="meta">Segurança não é paga: conversa, denúncia, bloqueio e distância em faixa ficam no gratuito.</p>
      <div style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
        <section className={plus ? "plan" : "plan current"}>
          <h2 style={{ marginTop: 0 }}>Gratuito {plus ? "" : "· seu plano"}</h2>
          <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem" }}>
            <li>Lote diário de até 10 pessoas</li>
            <li>Até 10 sinais por dia</li>
            <li>Conversa, encontro, denúncia e bloqueio</li>
          </ul>
        </section>
        <section className={plus ? "plan current" : "plan"}>
          <h2 style={{ marginTop: 0 }}>Plus {plus ? "· seu plano" : ""}</h2>
          <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem" }}>
            <li>Lote diário de até 20 pessoas</li>
            <li>Sinais sem teto</li>
            <li>Ver quem sinalizou você</li>
          </ul>
          {plus ? null : (
            <form action="/api/plus" method="post" style={{ marginTop: "1rem" }}>
              <input type="hidden" name="chave" value={crypto.randomUUID()} />
              <input type="hidden" name="voltar" value="/plus" />
              <button type="submit" className="sun">
                Ativar Plus simulado
              </button>
              <p className="meta" style={{ fontSize: "0.9rem" }}>
                Nenhum pagamento real acontece nesta versão.
              </p>
            </form>
          )}
        </section>
      </div>
    </Shell>
  );
}
