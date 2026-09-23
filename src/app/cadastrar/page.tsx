import { Shell, ErrorNote } from "@/components/Shell";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  return (
    <Shell>
      <h1>Criar conta</h1>
      <ErrorNote message={erro} />
      <p className="meta">
        A data de nascimento fica só para a conferência simulada de 18+. O resultado guardado é o método, a faixa e a data.
      </p>
      <form action="/api/auth/cadastrar" method="post">
        <label>
          Nome
          <input name="displayName" required maxLength={80} />
        </label>
        <label>
          E-mail
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Senha
          <input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <label>
          Nascimento
          <input name="birthDate" type="date" required />
        </label>
        <label>
          Intenção
          <select name="intent" defaultValue="serio">
            <option value="serio">Algo sério</option>
            <option value="casual">Algo casual</option>
            <option value="amigos">Amizade</option>
          </select>
        </label>
        <label>
          Gênero
          <select name="gender" defaultValue="mulher">
            <option value="mulher">Mulher</option>
            <option value="homem">Homem</option>
            <option value="nao-binario">Não binário</option>
          </select>
        </label>
        <label>
          Bairro
          <select name="gridCell" defaultValue="sao-paulo:pinheiros">
            <option value="sao-paulo:pinheiros">Pinheiros</option>
            <option value="sao-paulo:vila-madalena">Vila Madalena</option>
            <option value="sao-paulo:moema">Moema</option>
            <option value="sao-paulo:centro">Centro</option>
            <option value="campinas:cambui">Cambui, Campinas</option>
          </select>
        </label>
        <p>
          <button type="submit">Criar conta</button>
        </p>
      </form>
    </Shell>
  );
}
