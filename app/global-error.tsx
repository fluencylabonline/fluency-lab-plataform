"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Último recurso: o próprio layout falhou, então não há provider de i18n nem CSS
 * garantidos. Texto bilíngue fixo e estilos inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="pt">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0b0b0f", color: "#f4f4f5" }}>
        <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: 16 }}>
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>Algo deu errado</h1>
            <p style={{ opacity: 0.7, marginTop: 0 }}>Something went wrong. Tente de novo / Please try again.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
              <button
                onClick={() => reset()}
                style={{ padding: "10px 18px", borderRadius: 8, border: 0, cursor: "pointer", fontWeight: 600 }}
              >
                Tentar de novo / Retry
              </button>
              <Link href="/" style={{ padding: "10px 18px", color: "inherit" }}>
                Início / Home
              </Link>
            </div>
            {error.digest && <p style={{ marginTop: 24, fontSize: 12, opacity: 0.5 }}>ref: {error.digest}</p>}
          </div>
        </main>
      </body>
    </html>
  );
}
