import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { listMatches, namesFor } from "@/server/actions";
import { currentUser } from "@/server/session";

export default async function ChatsPage() {
  const user = await currentUser();
  if (!user) redirect("/entrar");
  const matches = await listMatches(user.id);
  const ids = matches.map((match) => (match.userLow === user.id ? match.userHigh : match.userLow));
  const names = await namesFor(ids);

  return (
    <Shell signedIn admin={user.role === "admin"}>
      <h1>Conversas</h1>
      {matches.length === 0 ? <p>Quando os dois sinalizam, a conversa aparece aqui.</p> : null}
      <ul>
        {matches.map((match) => {
          const otherId = match.userLow === user.id ? match.userHigh : match.userLow;
          return (
            <li key={match.id}>
              <Link href={`/conversas/${match.id}`}>{names.get(otherId) ?? "Pessoa"}</Link>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}
