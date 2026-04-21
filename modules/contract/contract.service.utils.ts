/**
 * Utilitários do Service de Contratos (FluencyLab)
 */

interface TemplateData {
  user: {
    name: string;
    taxId: string;
    email: string;
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
}

/**
 * Injeta dados dinâmicos no template de contrato usando placeholders {{key}}.
 */
export function injectTemplateData(template: string, data: TemplateData): string {
  let content = template;
  
  const mapping: Record<string, string> = {
    "user.name": data.user.name || "",
    "user.taxId": data.user.taxId || "",
    "user.email": data.user.email || "",
    "school.name": data.school.name || "",
    "school.legalName": data.school.legalName || "",
    "school.taxId": data.school.taxId || "",
    "school.representative": data.school.representativeName || "",
    "date": data.date,
  };

  if (data.guardian) {
    mapping["guardian.name"] = data.guardian.name || "";
    mapping["guardian.taxId"] = data.guardian.taxId || "";
    mapping["guardian.relationship"] = data.guardian.relationship || "";
  }

  // Iteramos sobre o mapeamento e substituímos no template
  Object.entries(mapping).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, "g");
    content = content.replace(placeholder, value);
  });

  return content;
}
