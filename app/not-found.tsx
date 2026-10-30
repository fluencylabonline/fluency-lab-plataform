/**
 * 404 raiz: usado quando o próprio layout de [locale] chama notFound()
 * (locale inválido), caso em que app/[locale]/not-found.tsx não é alcançado.
 */
export default function RootNotFound() {
  return (
    <html lang="pt">
      <body>
        <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", fontFamily: "sans-serif" }}>
          <div style={{ textAlign: "center" }}>
            <h1>404</h1>
            <p>Page not found</p>
          </div>
        </main>
      </body>
    </html>
  );
}
