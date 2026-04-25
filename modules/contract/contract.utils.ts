/**
 * Utilitários de Validação Regional (FluencyLab)
 * 
 * Suporte para Brasil (BR) e Estados Unidos (US).
 */

/**
 * Validação de CPF (Brasil)
 */
export function isValidCPF(cpf: string): boolean {
  if (typeof cpf !== "string") return false;
  const cleanCPF = cpf.replace(/[^\d]+/g, "");
  
  if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) return false;
  
  const cpfArr = cleanCPF.split("").map((el) => +el);
  
  const rest = (count: number) => {
    let sum = 0;
    for (let i = 1; i <= count - 1; i++) {
      sum = sum + cpfArr[i - 1] * (count - i + 1);
    }
    let r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r;
  };

  return rest(10) === cpfArr[9] && rest(11) === cpfArr[10];
}

/**
 * Validação de CNPJ (Brasil) - Usado por professores (PJ)
 */
export function isValidCNPJ(cnpj: string): boolean {
  if (typeof cnpj !== "string") return false;
  const cleanCNPJ = cnpj.replace(/[^\d]+/g, "");
  
  if (cleanCNPJ.length !== 14 || !!cleanCNPJ.match(/(\d)\1{13}/)) return false;
  
  const size = cleanCNPJ.length - 2;
  const numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  
  const calculateDigit = (num: string, startWeight: number) => {
    let sum = 0;
    let pos = startWeight;
    for (let i = num.length; i >= 1; i--) {
      sum += +num.charAt(num.length - i) * pos--;
      if (pos < 2) pos = 9;
    }
    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result;
  };

  const digit1 = calculateDigit(numbers, size - 7);
  const digit2 = calculateDigit(numbers + digit1, size - 6);

  return digit1 === +digits.charAt(0) && digit2 === +digits.charAt(1);
}

/**
 * Validação de SSN (USA)
 * Formatos aceitos: XXX-XX-XXXX ou XXXXXXXXX
 */
export function isValidSSN(ssn: string): boolean {
  if (!ssn) return false;
  const ssnRegex = /^(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/;
  const cleanSSN = ssn.replace(/[^\d]+/g, "");
  
  if (cleanSSN.length === 9) {
    const formatted = `${cleanSSN.slice(0, 3)}-${cleanSSN.slice(3, 5)}-${cleanSSN.slice(5)}`;
    return ssnRegex.test(formatted);
  }
  
  return ssnRegex.test(ssn);
}

/**
 * Validação de CEP (Brasil)
 */
export function isValidCEP(cep: string): boolean {
  return /^\d{5}-?\d{3}$/.test(cep);
}

/**
 * Validação de ZIP Code (USA)
 */
export function isValidZipCode(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip);
}

/**
 * Validador Genérico de Tax ID por Região e Tipo de Pessoa
 */
export function isValidTaxId(taxId: string, region: "BR" | "US", partyType: "individual" | "business"): boolean {
  if (region === "BR") {
    return partyType === "individual" ? isValidCPF(taxId) : isValidCNPJ(taxId);
  }
  if (region === "US") {
    // Para simplificar, assumimos que indivíduos usam SSN. 
    // PJ nos EUA usa EIN (9 dígitos), mas validaremos SSN pattern por enquanto ou similar.
    return isValidSSN(taxId); 
  }
  return false;
}

/**
 * Busca geolocalização aproximada via IP (Audit)
 */
export async function getGeoLocationByIp(ip: string): Promise<string> {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1") {
    return "Localhost/Unknown";
  }

  try {
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
    const geoData = await geoResponse.json();
    if (geoData.status === "success") {
      return `${geoData.city}, ${geoData.regionName}, ${geoData.country}`;
    }
    return "unknown";
  } catch (error) {
    console.error("[getGeoLocationByIp] Geolocation error:", error);
    return "unknown";
  }
}

/**
 * Busca endereço via CEP (Brasil)
 */
export async function getAddressByCep(cep: string) {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch (error) {
    console.error("[getAddressByCep] CEP lookup failed:", error);
    return null;
  }
}

/**
 * Calcula a idade a partir de uma data de nascimento
 */
export function calculateAge(birthDate: Date | string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Verifica se é menor de idade (menor que 18 anos)
 */
export function isMinor(birthDate: Date | string | null | undefined): boolean {
  if (!birthDate) return false;
  return calculateAge(birthDate) < 18;
}
