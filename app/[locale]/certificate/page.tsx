
import { BackButton } from "@/components/ui/back-button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { CertificateSearchForm } from "./_components/CertificateSearchForm";
import { Search, Award } from "lucide-react";

export default async function CertificatePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 w-full border-b bg-background">
        <div className="flex h-fit items-center justify-between">
          <BackButton href="/" />
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <main className="container py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black tracking-tight mb-4">
              Verifique a validade de um certificado
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nossa plataforma garante a integridade e autenticidade de cada certificado emitido. 
              Basta inserir o código abaixo para conferir os detalhes.
            </p>
          </div>

          <CertificateSearchForm />
        
        </div>
      </main>
    </div>
  );
}