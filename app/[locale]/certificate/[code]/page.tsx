import { certificateService } from "@/modules/certificate/certificate.service";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Award, Calendar, Clock, User, Languages } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface VerifyCertificatePageProps {
  params: Promise<{
    code: string;
    locale: string;
  }>;
}

export default async function VerifyCertificatePage({ params }: VerifyCertificatePageProps) {
  const { code } = await params;
  const certificate = await certificateService.getCertificateByCode(code);

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-2xl py-12">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Award className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold">Verificação de Certificado</h1>
          <p className="text-muted-foreground mt-2">
            Autenticidade e integridade de certificados Fluency Lab
          </p>
        </div>

        {certificate ? (
          <div className="card border-primary/50 bg-primary/5 p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-primary flex items-center gap-1 text-sm font-bold bg-white px-3 py-1 rounded-full shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              VÁLIDO
            </div>

            <div className="flex flex-col gap-6">
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Estudante</span>
                </div>
                <p className="text-xl font-bold">{certificate.studentName}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Languages className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Curso</span>
                  </div>
                  <p className="font-semibold text-lg">{certificate.courseLanguage}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Award className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Nível</span>
                  </div>
                  <p className="font-semibold text-lg">{certificate.levelCode}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Carga Horária</span>
                  </div>
                  <p className="font-semibold text-lg">{certificate.hours} Horas</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Data de Emissão</span>
                  </div>
                  <p className="font-semibold text-lg">
                    {format(new Date(certificate.issuedAt), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              <div className="bg-white/50 p-4 rounded-lg border text-sm italic text-muted-foreground">
                &quot;{certificate.levelDescription}&quot;
              </div>

              <div className="pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                <p>Código: <span className="font-mono font-bold text-foreground">{certificate.code}</span></p>
                <p>Fluency Lab Plataform</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card border-destructive/50 bg-destructive/5 p-12 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-destructive">Certificado Não Encontrado</h2>
            <p className="text-muted-foreground mt-2">
              Não foi possível encontrar um certificado com o código <span className="font-mono font-bold text-foreground">&quo t;{code}&quot;</span>.
              Certifique-se de que o código está correto ou entre em contato com o suporte.
            </p>
          </div>
        )}

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/certificate" className="text-primary hover:underline font-medium">
            Verificar outro código
          </Link>
          <span className="text-muted-foreground hidden sm:block">•</span>
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Ir para a Fluency Lab
          </Link>
        </div>
      </main>
    </div>
  );
}
