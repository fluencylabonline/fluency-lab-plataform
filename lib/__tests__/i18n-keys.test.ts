import { describe, it, expect } from "vitest";
import path from "path";
import { flattenKeys, findUsedKeys } from "../i18n-key-scan";
import pt from "../../messages/pt.json";
import en from "../../messages/en.json";

const ROOT = path.resolve(__dirname, "../..");
const ptKeys = new Set(flattenKeys(pt));
const enKeys = new Set(flattenKeys(en));

describe("i18n: chaves de tradução", () => {
  it("pt e en têm o mesmo conjunto de chaves", () => {
    const onlyPt = [...ptKeys].filter((k) => !enKeys.has(k));
    const onlyEn = [...enKeys].filter((k) => !ptKeys.has(k));
    expect({ onlyPt, onlyEn }).toEqual({ onlyPt: [], onlyEn: [] });
  });

  it("toda chave literal usada no código existe em pt.json", () => {
    const used = findUsedKeys(ROOT, ["app", "modules", "components", "hooks", "lib"]);
    const missing = [...new Set(used.filter((u) => !ptKeys.has(u.key)).map((u) => `${u.key}  <- ${u.file}`))].sort();
    expect(missing).toEqual([]);
  }, 60_000); // varre o repositório inteiro
});
