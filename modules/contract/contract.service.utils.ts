/**
 * Utilitários do Service de Contratos (FluencyLab)
 */

interface TemplateData {
  user: {
    name: string;
    taxId: string;
    email: string;
    businessTaxId?: string;
    pixKey?: string;
  };
  guardian?: {
    name: string;
    taxId: string;
    relationship: string;
  };
  school: {
    name: string;
    legalName: string;
    taxId: string;
    representativeName: string;
  };
  date: string;
  contract?: {
    durationMonths?: number | null;
  };
}

/**
 * Escapes HTML special characters to prevent XSS when rendering via dangerouslySetInnerHTML.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Injeta dados dinâmicos no template de contrato usando placeholders {{key}}.
 */
export function injectTemplateData(template: string, data: TemplateData): string {
  let content = template;
  
  const mapping: Record<string, string> = {
    "user.name": escapeHtml(data.user.name || ""),
    "user.taxId": escapeHtml(data.user.taxId || ""),
    "user.email": escapeHtml(data.user.email || ""),
    "user.businessTaxId": escapeHtml(data.user.businessTaxId || ""),
    "user.pixKey": escapeHtml(data.user.pixKey || ""),
    "school.name": escapeHtml(data.school.name || ""),
    "school.legalName": escapeHtml(data.school.legalName || ""),
    "school.taxId": escapeHtml(data.school.taxId || ""),
    "school.representative": escapeHtml(data.school.representativeName || ""),
    "date": escapeHtml(data.date),
  };

  if (data.guardian) {
    mapping["guardian.name"] = escapeHtml(data.guardian.name || "");
    mapping["guardian.taxId"] = escapeHtml(data.guardian.taxId || "");
    mapping["guardian.relationship"] = escapeHtml(data.guardian.relationship || "");
  }

  if (data.contract) {
    const months = data.contract.durationMonths;
    mapping["contract.durationMonths"] = months ? String(months) : "";
    mapping["contract.duration"] = months ? `${months} meses` : "";
  }

  // Iteramos sobre o mapeamento e substituímos no template
  Object.entries(mapping).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, "g");
    content = content.replace(placeholder, value);
  });

  return content;
}
