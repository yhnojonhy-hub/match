import Link from "next/link";

export function Shell({
  children,
  signedIn = false,
  admin = false,
  wide = false,
}: {
  children: React.ReactNode;
  signedIn?: boolean;
  admin?: boolean;
  wide?: boolean;
}) {
  return (
    <>
      <header className="top">
        <nav aria-label="Principal">
          <Link href={signedIn ? "/lote" : "/"} className="mark">
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
                <button type="submit" className="quiet">
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/entrar">Entrar</Link>
              <Link href="/cadastrar" className="button sun" style={{ marginLeft: "auto", padding: "0.5rem 0.9rem" }}>
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="wrap" style={wide ? { width: "min(1180px, calc(100% - 2.5rem))" } : undefined}>
        {children}
      </main>
      <footer className="foot">
        <span>Match · São Paulo · 18+</span>
        <span>
          <Link href="/privacidade">Privacidade</Link>
        </span>
        <span>A conferência de idade desta versão é simulada.</span>
      </footer>
    </>
  );
}

export function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="erro" role="alert">
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="10" cy="14" r="0.9" fill="currentColor" />
      </svg>
      <span>{message}</span>
    </p>
  );
}

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  userId,
  name,
  hasPhoto,
  size = "sm",
}: {
  userId: string;
  name: string;
  hasPhoto: boolean;
  size?: "sm" | "lg";
}) {
  const className = size === "lg" ? "avatar lg" : "avatar";
  if (hasPhoto) {
    return <img className={className} src={`/foto/${userId}`} alt="" width={size === "lg" ? 96 : 48} height={size === "lg" ? 96 : 48} />;
  }
  return (
    <span className={className} aria-hidden="true">
      {initialsOf(name)}
    </span>
  );
}
