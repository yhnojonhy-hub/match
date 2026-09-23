import { redirect } from "next/navigation";
import { Avatar, ErrorNote, Shell } from "@/components/Shell";
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
      <h1>Seu perfil</h1>
      <ErrorNote message={erro} />
      {!profile.photoName ? (
        <p className="hint">Coloque uma foto de rosto. Sem ela, o lote mostra só as iniciais.</p>
      ) : null}

      <h2 style={{ marginTop: "1.2rem" }}>Foto</h2>
      <p className="meta">
        Uma foto só, de rosto, em JPEG, PNG ou WebP até 6 MB. Guardamos uma cópia reduzida e sem os dados da câmera e
        do lugar.
      </p>
      <form action="/api/foto" method="post" encType="multipart/form-data">
        <input type="hidden" name="voltar" value="/perfil" />
        <div className="photo-row">
          <Avatar userId={user.id} name={profile.displayName} hasPhoto={Boolean(profile.photoName)} size="lg" />
          <div>
            <input name="foto" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher foto" />
            <p className="actions" style={{ marginTop: "0.8rem" }}>
              <button type="submit" name="acao" value="enviar" className="sun">
                Enviar foto
              </button>
              {profile.photoName ? (
                <button type="submit" name="acao" value="remover" className="quiet">
                  Remover foto
                </button>
              ) : null}
            </p>
          </div>
        </div>
      </form>

      <h2>Quem você é</h2>
      <form action="/api/perfil" method="post">
        <input type="hidden" name="voltar" value="/perfil" />
        <label>
          Nome
          <input name="displayName" defaultValue={profile.displayName} required maxLength={80} />
        </label>
        <label>
          Sobre você
          <span className="help">Até 400 caracteres. Aparece no cartão do lote.</span>
          <textarea name="bio" defaultValue={profile.bio} rows={3} maxLength={400} />
        </label>
        <label>
          Interesses
          <span className="help">Separe por vírgula. Os puxadores de conversa saem daqui.</span>
          <input name="interests" defaultValue={profile.interests} placeholder="café, trilha, cinema" />
        </label>
        <label>
          Intenção
          <select name="intent" defaultValue={profile.intent}>
            <option value="serio">Algo sério</option>
            <option value="casual">Algo casual</option>
            <option value="amigos">Amizade</option>
          </select>
        </label>

        <h2>Quem você quer ver</h2>
        <label>
          Gênero
          <select name="wantedGender" defaultValue={preference.gender}>
            <option value="qualquer">Qualquer gênero</option>
            <option value="mulher">Mulheres</option>
            <option value="homem">Homens</option>
            <option value="nao-binario">Pessoas não binárias</option>
          </select>
        </label>
        <div className="two">
          <label>
            Idade mínima
            <input name="minAge" type="number" min={18} max={99} defaultValue={preference.minAge} />
          </label>
          <label>
            Idade máxima
            <input name="maxAge" type="number" min={18} max={99} defaultValue={preference.maxAge} />
          </label>
        </div>
        <label>
          Distância
          <select name="maxDistance" defaultValue={preference.maxDistance}>
            <option value="5">Menos de 5 km</option>
            <option value="15">Menos de 15 km</option>
            <option value="qualquer">Mais longe também</option>
          </select>
        </label>
        <p className="actions">
          <button type="submit" className="sun">
            Guardar perfil
          </button>
        </p>
      </form>

      <h2>Encerrar a conta</h2>
      <p className="meta">A conta some deste produto. Suas mensagens ficam sem texto e a foto é apagada.</p>
      <form action="/api/conta" method="post">
        <button type="submit" className="danger">
          Apagar minha conta
        </button>
      </form>
    </Shell>
  );
}
