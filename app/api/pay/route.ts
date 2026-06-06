import { NextResponse } from "next/server";

/**
 * Public endpoint to safely redirect users from WhatsApp template buttons to Stripe or AbacatePay checkout links.
 * Example: /api/pay?url=https%3A%2F%2Fcheckout.stripe.com%2F...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing redirect URL" }, { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(targetUrl);
    const urlObj = new URL(decodedUrl);
    
    // Whitelist payment domains
    const allowedDomains = [
      "checkout.stripe.com",
      "billing.abacatepay.com",
      "api.abacatepay.com",
      "abacatepay.com",
      "stripe.com",
    ];

    const isAllowed = allowedDomains.some((domain) => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return NextResponse.json({ error: "Invalid redirect domain" }, { status: 400 });
    }

    return NextResponse.redirect(decodedUrl, 307);
  } catch (error) {
    console.error("[GET /api/pay] Error redirecting:", error);
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }
}
