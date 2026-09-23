import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { currentUser } from "@/server/session";

export default async function PlusPage() {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  const plan = user.subscription?.plan ?? "free";
  return (
    <Shell signedIn admin={user.role === "admin"}>
      <h1>Plus</h1>
      <p>Seu plano agora: {plan}.</p>
      <p>
        O gratuito já conversa, denuncia, bloqueia e mostra a distância em faixa. O Plus desta demonstração aumenta o
        lote para 20, tira o teto de 10 sinais e mostra quem sinalizou você. Nenhum pagamento real acontece.
      </p>
      <form action="/api/plus" method="post">
        <input type="hidden" name="chave" value={crypto.randomUUID()} />
        <input type="hidden" name="voltar" value="/plus" />
        <button type="submit">Ativar Plus simulado</button>
      </form>
    </Shell>
  );
}
