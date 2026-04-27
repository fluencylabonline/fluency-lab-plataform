import { financeService } from "@/modules/finance/finance.service";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { ForecastDetailsTable } from "./_components/ForecastDetailsTable";
import { ForecastFilters } from "./_components/ForecastFilters";

interface ForecastPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

export default async function AdminForecastPage({ searchParams }: ForecastPageProps) {
  const t = await getTranslations("AdminFinances.forecast");
  const resolvedParams = await searchParams;
  
  const now = new Date();
  const year = resolvedParams.year ? parseInt(resolvedParams.year) : now.getFullYear();
  const month = resolvedParams.month !== undefined ? parseInt(resolvedParams.month) : undefined;

  const details = await financeService.getDetailedForecast(year, month);

  return (
    <div className="flex flex-col gap-4">
      <Header 
        title={t("detailsTitle")} 
        subtitle={t("detailsSubtitle", { year })}
        backHref="/hub/admin/finances"
      />
      
      <main className="p-4 md:p-6 flex flex-col">
        <ForecastFilters 
          currentMonth={month ?? "all"} 
          currentYear={year} 
        />
        <ForecastDetailsTable initialData={details} />
      </main>
    </div>
  );
}
