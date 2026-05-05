
import { CertificateSearchForm } from "./_components/CertificateSearchForm";
import { Search, Award } from "lucide-react";

export default async function CertificatePage() {
  return (
    <div className="min-h-screen bg-background mt-10">
      <h1>Verificação de Certificado</h1>
      <span>Portal de Autenticidade Fluency Lab</span>
      <main className="container py-12 md:py-24">
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
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">Consulta Instantânea</h3>
              <p className="text-sm text-muted-foreground">Acesse os dados do aluno e curso em segundos.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">Padrão Internacional</h3>
              <p className="text-sm text-muted-foreground">Certificados baseados no Quadro Comum Europeu (CEFR).</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-4">
                <div className="font-mono font-bold text-lg">QR</div>
              </div>
              <h3 className="font-bold mb-2">Segurança Digital</h3>
              <p className="text-sm text-muted-foreground">Assinatura digital e código de verificação único.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}