import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import { env } from "@/env/server";
import { isQuietHours } from "@/lib/quiet-hours";
import {
  HOLIDAY_RECESS_CAMPAIGNS,
  holidayRecessCampaignFor,
  holidayRecessCampaignKey,
  type HolidayRecessCampaign,
} from "@/lib/holiday-recess";
import { communicationService } from "@/modules/communication/communication.service";
import { settingsService } from "@/modules/settings/settings.service";

// Emails do recesso de fim de ano (01/12, 15/12, 01/01 e 10/01, horário de Brasília).
// Agendado todo dia às 12:00 UTC (09:00 de Brasília) em .github/workflows/holiday-recess-cron.yml;
// fora dessas datas a rota não faz nada. Cada campanha é reservada antes do envio,
// então reexecuções no mesmo ano não reenviam.
//
// Corpo opcional (disparo manual): { campaign, mode: "dryRun" | "test" | "send", testEmail, locale }.
const bodySchema = z.object({
  campaign: z.enum(Object.keys(HOLIDAY_RECESS_CAMPAIGNS) as [HolidayRecessCampaign, ...HolidayRecessCampaign[]]).optional(),
  mode: z.enum(["dryRun", "test", "send"]).optional(),
  testEmail: z.string().email().optional(),
  locale: z.enum(["pt", "en"]).optional(),
});

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

  let body: unknown = {};
  try {
    const rawBody = await req.text();
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  const { mode = "send", testEmail, locale } = parsed.data;
  const now = new Date();
  const campaign = parsed.data.campaign ?? holidayRecessCampaignFor(now);

  if (!campaign) {
    return NextResponse.json({ success: true, skipped: "not-a-campaign-day" });
  }
  if (mode === "send" && isQuietHours(now)) {
    return NextResponse.json({ success: true, skipped: "quiet-hours" });
  }
  if (mode === "test" && !testEmail) {
    return NextResponse.json({ error: "testEmail is required in test mode" }, { status: 400 });
  }

  let claimedKey: string | null = null;
  try {
    if (mode !== "send") {
      const result = await communicationService.sendHolidayRecessCampaign({
        campaign,
        mode,
        requester: testEmail ? { email: testEmail, name: "Equipe Fluency Lab", locale } : undefined,
        now,
      });
      return NextResponse.json({ success: true, campaign, mode, ...result });
    }

    const key = holidayRecessCampaignKey(campaign, now);
    const claimed = await settingsService.claimHolidayRecessCampaign(key);
    if (!claimed) {
      return NextResponse.json({ success: true, campaign, skipped: "already-sent", key });
    }
    claimedKey = key;

    const result = await communicationService.sendHolidayRecessCampaign({ campaign, mode, now });
    // Falhou por inteiro (ex.: Resend fora do ar): libera a campanha para o cron tentar de novo.
    if (result.sent === 0 && result.failed > 0) {
      await settingsService.releaseHolidayRecessCampaign(key);
    }
    return NextResponse.json({ success: true, campaign, key, ...result });
  } catch (error) {
    console.error("[Cron Holiday Recess] Error:", error);
    if (claimedKey) await settingsService.releaseHolidayRecessCampaign(claimedKey).catch(() => {});
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
