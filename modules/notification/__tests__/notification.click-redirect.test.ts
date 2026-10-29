// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/notifications/click/route";

vi.mock("@/lib/auth-server", () => ({ getCurrentUser: vi.fn().mockResolvedValue(null) }));
vi.mock("@/modules/learning/learning.service", () => ({ learningService: { logEngagement: vi.fn() } }));

const ORIGIN = "https://www.fluencylab.me";

async function redirectFor(url: string) {
  const res = await GET(new NextRequest(`${ORIGIN}/api/notifications/click?url=${encodeURIComponent(url)}`));
  return res.headers.get("location");
}

describe("GET /api/notifications/click", () => {
  it("redireciona para caminhos internos", async () => {
    expect(await redirectFor("/hub/student/practice?tab=review")).toBe(`${ORIGIN}/hub/student/practice?tab=review`);
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "javascript:alert(1)",
  ])("bloqueia destino externo %s", async (target) => {
    expect(await redirectFor(target)).toBe(`${ORIGIN}/hub/student/practice`);
  });

  it("usa o destino padrão sem url", async () => {
    const res = await GET(new NextRequest(`${ORIGIN}/api/notifications/click`));
    expect(res.headers.get("location")).toBe(`${ORIGIN}/hub/student/practice`);
  });
});
