import type { Metadata } from "next";
import { getLocale, getMessages } from "next-intl/server";
import { cookies } from "next/headers";
import { Providers } from "@/components/layout/providers";
import { Quicksand } from "next/font/google";
import "../globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});
export const metadata: Metadata = {
  title: "FluencyLab",
  description: "Plataforma de ensino de idiomas",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
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
          {children}
        </Providers>
      </body>
    </html>
  );
}