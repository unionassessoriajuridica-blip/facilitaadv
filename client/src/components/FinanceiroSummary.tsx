import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, Calendar } from "lucide-react";
import { formatCurrency } from "@/utils/currency";

interface FinanceiroSummaryProps {
  totalPendente: number;
  totalPago: number;
  totalVencido: number;
}

const FinanceiroSummary = ({ totalPendente, totalPago, totalVencido }: FinanceiroSummaryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Pendente</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalPendente)}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Recebido</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPago)}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Vencido</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalVencido)}</p>
            </div>
            <Calendar className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceiroSummary;