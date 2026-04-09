import type { Locale } from "@/i18n/config";

/**
 * Format a value in cents to a currency string.
 * @example formatCurrency(1500) → "R$ 15,00"
 * @example formatCurrency(1500, "en") → "$15.00"
 */
export function formatCurrency(
  valueInCents: number,
  locale: Locale = "pt-BR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: locale === "pt-BR" ? "BRL" : "USD",
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
