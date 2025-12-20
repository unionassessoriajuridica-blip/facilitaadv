import * as React from "react";
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, X, AlertTriangle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  cliente_nome?: string;
  lida: boolean;
  created_at: string;
}

export const SubtleNotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotificacoes();
      checkAndCreateNotifications();
    }
  }, [user]);

  const loadNotificacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotificacoes(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const checkAndCreateNotifications = async () => {
    try {
      // Buscar parcelas agrupadas por cliente
      const { data: financeiro, error } = await supabase
        .from('financeiro')
        .select('cliente_nome, status')
        .eq('user_id', user?.id)
        .eq('status', 'PENDENTE');

      if (error) throw error;

      // Agrupar por cliente e contar parcelas pendentes
      const clientesComParcelas: { [key: string]: number } = {};
      financeiro?.forEach(item => {
        clientesComParcelas[item.cliente_nome] = (clientesComParcelas[item.cliente_nome] || 0) + 1;
      });

      // Para cada cliente com 3+ parcelas, verificar se já existe notificação
      for (const [cliente_nome, count] of Object.entries(clientesComParcelas)) {
        if (count >= 3) {
          // Verificar se já existe notificação não lida
          const { data: existingNotification } = await supabase
            .from('notificacoes')
            .select('id')
            .eq('user_id', user?.id)
            .eq('cliente_nome', cliente_nome)
            .eq('tipo', 'PARCELAS_EM_ABERTO')
            .eq('lida', false)
            .single();

          if (!existingNotification) {
            // Criar nova notificação
            await supabase
              .from('notificacoes')
              .insert({
                user_id: user?.id,
                tipo: 'PARCELAS_EM_ABERTO',
                titulo: 'Atenção: Parcelas em Aberto',
                mensagem: `O cliente ${cliente_nome} possui ${count} parcelas pendentes. Considere entrar em contato.`,
                cliente_nome: cliente_nome,
                lida: false
              });
          }
        }
      }

      // Recarregar notificações após verificação
      loadNotificacoes();
    } catch (error: any) {
      console.error('Erro ao verificar parcelas:', error);
    }
  };

  const marcarComoLida = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);

      if (error) throw error;

      setNotificacoes(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, lida: true } : notif
        )
      );

      toast({
        title: "Notificação marcada como lida",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Erro ao marcar notificação:', error);
      toast({
        title: "Erro ao marcar notificação",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('user_id', user?.id)
        .eq('lida', false);

      if (error) throw error;

      setNotificacoes(prev => 
        prev.map(notif => ({ ...notif, lida: true }))
      );

      toast({
        title: "Todas as notificações foram marcadas como lidas",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Erro ao marcar todas as notificações:', error);
      toast({
        title: "Erro ao marcar notificações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const notificacaoNaoLidas = notificacoes.filter(n => !n.lida);

  // Se não há notificações, não mostra nada
  if (notificacoes.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {notificacaoNaoLidas.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notificacaoNaoLidas.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notificações
                {notificacaoNaoLidas.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {notificacaoNaoLidas.length}
                  </Badge>
                )}
              </CardTitle>
              {notificacaoNaoLidas.length > 0 && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={marcarTodasComoLidas}
                  disabled={loading}
                  className="text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Marcar todas
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="max-h-80 overflow-y-auto">
            <div className="space-y-2">
              {notificacoes.slice(0, 5).map((notificacao) => (
                <div 
                  key={notificacao.id} 
                  className={`p-3 rounded-lg border text-sm ${
                    !notificacao.lida 
                      ? 'bg-orange-50 border-orange-200 border-l-4 border-l-orange-500' 
                      : 'bg-gray-50 border-gray-200 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3 h-3 text-orange-600 flex-shrink-0" />
                        <span className="font-medium text-xs truncate">{notificacao.titulo}</span>
                        {!notificacao.lida && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">Nova</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {notificacao.mensagem}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notificacao.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {!notificacao.lida && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => marcarComoLida(notificacao.id)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {notificacoes.length > 5 && (
                <p className="text-xs text-gray-500 text-center py-2">
                  E mais {notificacoes.length - 5} notificações...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};