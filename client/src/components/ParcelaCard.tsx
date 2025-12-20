import * as React from "react";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CheckCircle, MessageCircle, Clock, Calendar, Trash2 } from "lucide-react";
import { useCobrancaMessages } from "@/hooks/useCobrancaMessages.ts";
import { formatCurrency } from "@/utils/currency.ts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";

interface ParcelaCardProps {
  id: string;
  clienteNome: string;
  valor: number;
  tipo: string;
  status: string;
  vencimento: string;
  dataPagamento?: string;
  index?: number;
  onBaixaPagamento: (id: string) => void;
  onExcluirParcela?: (id: string, clienteNome: string) => void;
  onExcluirTodasParcelas?: (clienteNome: string) => void;
  showClienteName?: boolean;
  showExcluirOpcoes?: boolean;
}

const ParcelaCard = ({
  id,
  clienteNome,
  valor,
  tipo,
  status,
  vencimento,
  dataPagamento,
  index,
  onBaixaPagamento,
  onExcluirParcela,
  onExcluirTodasParcelas,
  showClienteName = true,
  showExcluirOpcoes = false,
}: ParcelaCardProps) => {
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false);
  const [excluirTodasDialogOpen, setExcluirTodasDialogOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAGO":
        return <CheckCircle className="w-4 h-4" />;
      case "PENDENTE":
        return <Clock className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const { enviarMensagemCobranca, loading } = useCobrancaMessages();

  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "PAGO":
        return "default";
      case "PENDENTE":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "Honorários":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Entrada":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "TMP":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const isVencido = (vencimento: string, status: string) => {
    if (status === "PAGO") return false;
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    return dataVencimento < hoje;
  };

  const formatParcelaTitle = () => {
    if (tipo === "Honorários" && typeof index === "number") {
      return `Parcela ${index + 1}`;
    }
    return tipo;
  };

  const handleExcluirParcelaConfirmada = () => {
    if (onExcluirParcela) {
      onExcluirParcela(id, clienteNome);
    }
    setExcluirDialogOpen(false);
  };

  const handleExcluirTodasConfirmada = () => {
    if (onExcluirTodasParcelas) {
      onExcluirTodasParcelas(clienteNome);
    }
    setExcluirTodasDialogOpen(false);
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all hover:shadow-md ${
        isVencido(vencimento, status)
          ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
          : "bg-background"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {showClienteName && (
              <span className="font-medium text-foreground">{clienteNome}</span>
            )}
            <span className="font-medium text-foreground">
              {formatParcelaTitle()}
            </span>
            <Badge className={getTipoColor(tipo)}>{tipo}</Badge>
            <Badge
              variant={getStatusVariant(status)}
              className="flex items-center gap-1"
            >
              {getStatusIcon(status)}
              {status}
            </Badge>
            {isVencido(vencimento, status) && (
              <Badge variant="destructive">VENCIDO</Badge>
            )}
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="font-medium">Valor:</span>{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(valor)}
              </span>
            </p>
            <p>
              <span className="font-medium">Vencimento:</span>{" "}
              <span className="font-semibold text-foreground">
                {new Date(vencimento).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </p>
            {dataPagamento && (
              <p>
                <span className="font-medium">Pago em:</span>{" "}
                <span className="font-semibold text-green-600">
                  {new Date(dataPagamento).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => enviarMensagemCobranca(id)}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <MessageCircle className="w-3 h-3" />
            Enviar Cobrança
          </Button>
          
          {status === "PENDENTE" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Dar Baixa
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
                  <AlertDialogDescription>
                    Confirma o recebimento de{" "}
                    <strong>{formatCurrency(valor)}</strong> de{" "}
                    <strong>{clienteNome}</strong> ({formatParcelaTitle()})?
                    <br />
                    <span className="text-sm text-muted-foreground mt-2 block">
                      Esta ação registrará a data de hoje como data de
                      pagamento.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onBaixaPagamento(id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Confirmar Pagamento
                  </AlertDialogAction>
                  
                  {onExcluirParcela && (
                    <>
                      <AlertDialogAction
                        onClick={() => setExcluirDialogOpen(true)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir Parcela
                      </AlertDialogAction>
                      
                      {showExcluirOpcoes && onExcluirTodasParcelas && (
                        <AlertDialogAction
                          onClick={() => setExcluirTodasDialogOpen(true)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Excluir Todas as Parcelas
                        </AlertDialogAction>
                      )}
                    </>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Diálogo de confirmação para excluir parcela individual */}
      <AlertDialog open={excluirDialogOpen} onOpenChange={setExcluirDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta parcela de{" "}
              <strong>{formatCurrency(valor)}</strong> do cliente{" "}
              <strong>{clienteNome}</strong>?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirParcelaConfirmada}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Excluir Parcela
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmação para excluir todas as parcelas */}
      <AlertDialog open={excluirTodasDialogOpen} onOpenChange={setExcluirTodasDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>TODAS</strong> as parcelas do cliente{" "}
              <strong>{clienteNome}</strong>?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Esta ação não pode ser desfeita e removerá todos os registros financeiros deste cliente.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirTodasConfirmada}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Excluir Todas as Parcelas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ParcelaCard;