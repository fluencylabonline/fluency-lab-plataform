import { NextResponse } from "next/server";
import { contractService } from "@/modules/contract/contract.service";
import { env } from "@/env";

import crypto from "node:crypto";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${env.CRON_SECRET}`;
  const provided = authHeader ?? "";
  const isAuthorized =
    provided.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await contractService.processContractRenewals();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[Cron Contracts] Error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
