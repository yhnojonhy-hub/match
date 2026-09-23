import { Shell, ErrorNote } from "@/components/Shell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  return (
    <Shell>
      <h1>Entrar</h1>
      <ErrorNote message={erro} />
      <form action="/api/auth/entrar" method="post">
        <label>
          E-mail
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Senha
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        <p className="actions">
          <button type="submit" className="sun">
            Entrar
          </button>
        </p>
      </form>
      <p className="meta">
        Ainda sem conta? <a href="/cadastrar">Criar conta</a>
      </p>
    </Shell>
  );
}
