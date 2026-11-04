import { NextResponse } from "next/server";

/**
 * Hosts de checkout para os quais os botões do WhatsApp podem redirecionar.
 * Só o Stripe Checkout gera URL (`session.url`); o PIX da AbacatePay é um código
 * copia-e-cola, nunca um link. Lista exata: subdomínios genéricos (ex.: buy.stripe.com,
 * files.stripe.com) não entram.
 */
const ALLOWED_HOSTS = new Set(["checkout.stripe.com"]);
const MAX_URL_LENGTH = 2000;

/**
 * Public endpoint to safely redirect users from WhatsApp template buttons to the checkout.
 * Example: /api/pay?url=https%3A%2F%2Fcheckout.stripe.com%2F...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // `searchParams.get` já devolve o valor decodificado; decodificar de novo altera a URL.
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing redirect URL" }, { status: 400 });
  }

  if (targetUrl.length > MAX_URL_LENGTH) {
    return NextResponse.json({ error: "Redirect URL too long" }, { status: 400 });
  }

  let urlObj: URL;
  try {
    urlObj = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  if (urlObj.protocol !== "https:" || urlObj.username || urlObj.password || !ALLOWED_HOSTS.has(urlObj.hostname)) {
    return NextResponse.json({ error: "Invalid redirect domain" }, { status: 400 });
  }

  return NextResponse.redirect(urlObj.toString(), 307);
}
