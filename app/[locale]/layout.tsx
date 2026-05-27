import type { Metadata, Viewport } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { Providers } from "@/components/layout/providers";
import { Quicksand } from "next/font/google";
import { env } from "@/env";
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
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  let metadataBase: URL;
  try {
    metadataBase = new URL(baseUrl);
  } catch {
    metadataBase = new URL("https://fluency-lab-plataform.vercel.app");
  }

  return {
    title: t("title"),
    description: t("description"),
    metadataBase,
    manifest: "/manifest.json",
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: baseUrl,
      siteName: "Fluency Lab",
      type: "website",
      images: [
        {
          url: "/brand/logo.png",
          width: 1200,
          height: 630,
          alt: "Fluency Lab",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/brand/logo.png"],
    },
    icons: {
      apple: "/icons/ios/180.png",
    },
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
  interactiveWidget: "resizes-content",
  // themeColor: [
  //   { media: "(prefers-color-scheme: light)", color: "oklch(70.9% 0.00008 271.152)" }, //header-base
  //   { media: "(prefers-color-scheme: dark)", color: "oklch(12.048% 0.02283 254.114)" }, //header-base
  // ],
  themeColor: "#121520",
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
  const nonce = (await headers()).get("x-nonce") || undefined;

  const themeColor = cookieStore.get("fluency-lab-theme-color")?.value || "indigo";
  const themeMode = cookieStore.get("fluency-lab-mode")?.value || "system";

  return (
    <html
      lang={locale}
      className={`theme-${themeColor} ${quicksand.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <link 
          rel="preload" 
          as="image" 
          href="/icons/android/launchericon-transparent-512x512.png" 
        />
      </head>

      <body className={`${quicksand.className} min-h-full flex flex-col`}>
        {/* Static Splash - Mostrado IMEDIATAMENTE antes da hidratação do React */}
        <div 
          id="pwa-static-splash" 
          className="fixed inset-0 z-9990 flex items-center justify-center bg-[#212121] transition-opacity duration-300"
          style={{ display: 'none' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/icons/android/launchericon-transparent-512x512.png" 
            alt="Loading..."
            className="w-64 h-64 object-contain"
          />
        </div>


        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
                var hasShown = sessionStorage.getItem('pwa-splash-shown');
                if (isStandalone && !hasShown) {
                  document.documentElement.classList.add('pwa-initializing');
                  var staticSplash = document.getElementById('pwa-static-splash');
                  if (staticSplash) staticSplash.style.display = 'flex';
                  
                  // Fail-safe: remove after 5 seconds if PwaSplash doesn't
                  setTimeout(function() {
                    document.documentElement.classList.remove('pwa-initializing');
                    if (staticSplash) staticSplash.style.display = 'none';
                  }, 5000);
                }
              })();
            `,
          }}
        />

        <Providers
          locale={locale}
          messages={messages}
          themeMode={themeMode}
          nonce={nonce}
        >
          <div id="vault-root" className="h-full">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}