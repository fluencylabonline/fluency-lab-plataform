"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MonthlyFinance } from "@/modules/dashboard/dashboard.types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { useTranslations } from "next-intl";

interface FinanceChartsProps {
  data: MonthlyFinance[];
  pendingIncome: number;
}

export function FinanceCharts({ data, pendingIncome }: FinanceChartsProps) {
  const t = useTranslations("Dashboard.finance");

  return (
    <Card className="col-span-full lg:col-span-4 card border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold">{t("cashFlow")}</CardTitle>
          <CardDescription>{t("cashFlowDesc")}</CardDescription>
        </div>
        {pendingIncome > 0 && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              A Receber
            </span>
            <span className="text-sm font-bold text-amber-500">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pendingIncome)}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="h-[300px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="4" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip 
              cursor={{ fill: "hsl(var(--muted)/0.1)" }}
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                borderColor: "hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
              }}
            />
            <Bar 
              name={t("income")} 
              dataKey="income" 
              fill="hsl(var(--primary))" 
              radius={[6, 6, 0, 0]} 
              barSize={20}
            />
            <Bar 
              name={t("expense")} 
              dataKey="expense" 
              fill="hsl(var(--destructive))" 
              radius={[6, 6, 0, 0]} 
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
