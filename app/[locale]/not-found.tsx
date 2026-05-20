import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      {/* Premium background styling - Glowing subtle radial gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-lg w-full text-center">
        {/* Centered Premium 404 layout utilizing our vertical-slice styling */}
        <div className="card p-8 md:p-12 border-none bg-slate-300/5 dark:bg-slate-950/20 backdrop-blur-md flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-8 animate-pulse">
            <Compass className="w-10 h-10" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground font-sans">
            {t("title")}
          </h1>

          <p className="text-muted-foreground leading-relaxed mb-8 text-lg max-w-md">
            {t("description")}
          </p>

          <Link
            href="/"
            className={buttonVariants({
              size: "lg",
              className: "w-full sm:w-auto font-semibold px-8",
            })}
          >
            {t("cta")}
          </Link>
        </div>
      </main>
    </div>
  );
}
