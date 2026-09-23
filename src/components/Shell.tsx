import Link from "next/link";

export function Shell({
  children,
  signedIn = false,
  admin = false,
}: {
  children: React.ReactNode;
  signedIn?: boolean;
  admin?: boolean;
}) {
  return (
    <div className="wrap">
      <nav>
        <Link href={signedIn ? "/lote" : "/"} className="display" style={{ fontSize: "1.4rem" }}>
          Match
        </Link>
        {signedIn ? (
          <>
            <Link href="/lote">Lote</Link>
            <Link href="/conversas">Conversas</Link>
            <Link href="/perfil">Perfil</Link>
            <Link href="/plus">Plus</Link>
            {admin ? <Link href="/admin">Fila</Link> : null}
            <form action="/api/auth/sair" method="post">
              <button type="submit">Sair</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/entrar">Entrar</Link>
            <Link href="/cadastrar">Criar conta</Link>
          </>
        )}
      </nav>
      {children}
    </div>
  );
}

export function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="erro">{message}</p>;
}
