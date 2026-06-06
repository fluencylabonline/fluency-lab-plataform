"use client";

import { useFormatter } from "next-intl";
import { CreditCard, QrCode } from "lucide-react";

interface GatewayBalancesCardProps {
  balances: {
    stripe: {
      available: number;
      pending: number;
      currency: string;
    };
    abacate: {
      available: number;
      pending: number;
      blocked: number;
      currency: string;
    };
  };
}

export function GatewayBalancesCard({ balances }: GatewayBalancesCardProps) {
  const format = useFormatter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* AbacatePay Balance Card */}
      <div className="card border-border p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <QrCode className="size-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">AbacatePay</h4>
              <p className="text-[10px] text-muted-foreground">Integração PIX (BRL)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Saldo Disponível
          </span>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {format.number(balances.abacate.available / 100, {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px]">A Liberar</span>
            <span className="font-medium text-foreground">
              {format.number(balances.abacate.pending / 100, {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px]">Bloqueado</span>
            <span className="font-medium text-foreground">
              {format.number(balances.abacate.blocked / 100, {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stripe Balance Card */}
      <div className="card border-border p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <CreditCard className="size-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Stripe</h4>
              <p className="text-[10px] text-muted-foreground">Cartão de Crédito (USD)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Saldo em Conta
          </span>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {format.number(balances.stripe.available / 100, {
              style: "currency",
              currency: "USD",
            })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px]">A Receber</span>
            <span className="font-medium text-foreground">
              {format.number(balances.stripe.pending / 100, {
                style: "currency",
                currency: "USD",
              })}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px]">Moeda</span>
            <span className="font-medium text-foreground">Dólar Americano</span>
          </div>
        </div>
      </div>
    </div>
  );
}
