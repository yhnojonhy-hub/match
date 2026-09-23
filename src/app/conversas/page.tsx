import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, Shell } from "@/components/Shell";
import { listMatches, namesFor } from "@/server/actions";
import { currentUser } from "@/server/session";

export default async function ChatsPage() {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  const matches = await listMatches(user.id);
  const ids = matches.map((match) => (match.userLow === user.id ? match.userHigh : match.userLow));
  const people = await namesFor(ids);

  return (
    <Shell signedIn admin={user.role === "admin"}>
      <h1>Conversas</h1>
      {matches.length === 0 ? (
        <p className="meta">
          Quando os dois sinalizam, a conversa aparece aqui. <Link href="/lote">Voltar para o lote.</Link>
        </p>
      ) : null}
      <ul className="list" style={{ maxWidth: "40rem" }}>
        {matches.map((match) => {
          const otherId = match.userLow === user.id ? match.userHigh : match.userLow;
          const person = people.get(otherId);
          const name = person?.displayName ?? "Pessoa";
          return (
            <li key={match.id}>
              <Link className="row" href={`/conversas/${match.id}`}>
                <Avatar userId={otherId} name={name} hasPhoto={Boolean(person?.photoName)} />
                <div className="who">
                  <strong>{name}</strong>
                  <span>Sinal dos dois lados</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}
