import type { Metadata, Viewport } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { Providers } from "@/components/layout/providers";
import { Quicksand } from "next/font/google";
import "../globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.root" });

  return {
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("title"),
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(70.9% 0.00008 271.152)" }, //header-base
    { media: "(prefers-color-scheme: dark)", color: "oklch(12.048% 0.02283 254.114)" }, //header-base
  ],
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const cookieStore = await cookies();

  const themeColor = cookieStore.get("fluency-lab-theme-color")?.value || "violet";
  const themeMode = cookieStore.get("fluency-lab-mode")?.value || "system";

  return (
    <html
      lang={locale}
      className={`theme-${themeColor} ${quicksand.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className={`${quicksand.className} min-h-full flex flex-col`}>
        <Providers
          locale={locale}
          messages={messages}
          themeMode={themeMode}
        >
          <div id="vault-root" className="h-full">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}