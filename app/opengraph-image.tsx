import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const alt = "FluencyLab";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const t = await getTranslations({ locale: "pt", namespace: "Metadata.root" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #02060e 0%, #1e1b4b 100%)",
          color: "#f8fafc",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>FluencyLab</div>
        <div style={{ fontSize: 40, marginTop: 24, color: "#c7d2fe", maxWidth: 900 }}>
          {t("ogTagline")}
        </div>
      </div>
    ),
    size,
  );
}
