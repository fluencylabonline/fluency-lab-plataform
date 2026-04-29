"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCardData } from "@/modules/dashboard/dashboard.types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  data: StatCardData;
}

export function StatCard({ data }: StatCardProps) {
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: data.format === "currency" ? "currency" : "decimal",
    currency: "BRL",
    maximumFractionDigits: data.format === "currency" ? 2 : 0,
  }).format(Number(data.value));

  const hasChange = typeof data.change === "number";

  return (
    <Card className="card border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {data.title}
        </CardTitle>
        {data.trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
        {data.trend === "down" && <TrendingDown className="h-4 w-4 text-rose-500" />}
        {data.trend === "neutral" && <Minus className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {hasChange && (
          <p className={cn(
            "text-xs mt-1 font-medium",
            data.trend === "up" ? "text-emerald-500" : data.trend === "down" ? "text-rose-500" : "text-muted-foreground"
          )}>
            {data.change! > 0 ? "+" : ""}{data.change?.toFixed(1)}% em relação ao mês passado
          </p>
        )}
      </CardContent>
    </Card>
  );
}
