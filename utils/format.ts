import type { Locale } from "@/i18n/config";

/**
 * Format a value in cents to a currency string.
 * @example formatCurrency(1500) → "R$ 15,00"
 * @example formatCurrency(1500, "en") → "$15.00"
 */
export function formatCurrency(
  valueInCents: number,
  locale: Locale = "pt"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: locale === "pt" ? "BRL" : "USD",
  }).format(valueInCents / 100);
}

/**
 * Format a user's full name.
 * @example formatName("Matheus", "Fernandes") → "Matheus Fernandes"
 */
export function formatName(firstName: string, lastName?: string): string {
  return lastName ? `${firstName} ${lastName}` : firstName;
}

/**
 * Get up to 2 initials from a name.
 * @example formatInitials("Matheus Fernandes") → "MF"
 * @example formatInitials("Ana") → "AN"
 */
export function formatInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Truncate a string to a maximum length.
 * @example truncate("Hello World", 5) → "Hello..."
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

/**
 * Mask a CPF/CNPJ document.
 * @example maskDocument("000.000.000-00") → "000.***.***-**"
 */
export function maskDocument(doc?: string): string {
  if (!doc) return "—";
  const digits = doc.replace(/\D/g, "");
  if (digits.length === 11) {
    return doc.replace(/(\d{3})\.\d{3}\.(\d{3})-\d{2}/, "$1.***.***-**");
  }
  return doc.replace(
    /(\d{2})\.\d{3}\.\d{3}\/\d{4}-\d{2}/,
    "$1.***.***\/****-**"
  );
}

/**
 * Mask an email address.
 * @example maskEmail("user@example.com") → "us***@example.com"
 */
export function maskEmail(email?: string): string {
  if (!email) return "—";
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 2)}***@${domain}`;
}

/**
 * Mask a name showing only first name and last initial.
 * @example maskName("Matheus Fernandes") → "Matheus F."
 */
export function maskName(name?: string): string {
  if (!name) return "—";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
