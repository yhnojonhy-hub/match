import { redirect } from "next/navigation";
import { ErrorNote, Shell } from "@/components/Shell";
import { currentUser } from "@/server/session";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = await currentUser();
  if (!user?.profile || !user.preference) redirect("/entrar");
  const { erro } = await searchParams;
  const profile = user.profile;
  const preference = user.preference;

  return (
    <Shell signedIn admin={user.role === "admin"}>
      <h1>Perfil</h1>
      <ErrorNote message={erro} />
      <form action="/api/perfil" method="post">
        <input type="hidden" name="voltar" value="/perfil" />
        <label>
          Nome
          <input name="displayName" defaultValue={profile.displayName} required />
        </label>
        <label>
          Bio
          <textarea name="bio" defaultValue={profile.bio} rows={3} maxLength={400} />
        </label>
        <label>
          Interesses, separados por vírgula
          <input name="interests" defaultValue={profile.interests} />
        </label>
        <label>
          Intenção
          <select name="intent" defaultValue={profile.intent}>
            <option value="serio">Algo sério</option>
            <option value="casual">Algo casual</option>
            <option value="amigos">Amizade</option>
          </select>
        </label>
        <label>
          Quero ver
          <select name="wantedGender" defaultValue={preference.gender}>
            <option value="qualquer">Qualquer gênero</option>
            <option value="mulher">Mulheres</option>
            <option value="homem">Homens</option>
            <option value="nao-binario">Pessoas não binárias</option>
          </select>
        </label>
        <label>
          Idade mínima
          <input name="minAge" type="number" min={18} max={99} defaultValue={preference.minAge} />
        </label>
        <label>
          Idade máxima
          <input name="maxAge" type="number" min={18} max={99} defaultValue={preference.maxAge} />
        </label>
        <label>
          Distância
          <select name="maxDistance" defaultValue={preference.maxDistance}>
            <option value="5">Menos de 5 km</option>
            <option value="15">Menos de 15 km</option>
            <option value="qualquer">Mais longe também</option>
          </select>
        </label>
        <p>
          <button type="submit">Guardar perfil</button>
        </p>
      </form>
      <h2>Encerrar a conta</h2>
      <p>A conta some deste produto. Conversas suas ficam sem texto.</p>
      <form action="/api/conta" method="post">
        <button type="submit">Apagar minha conta</button>
      </form>
    </Shell>
  );
}
