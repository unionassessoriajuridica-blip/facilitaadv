import * as React from "react";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, X, AlertTriangle, Check, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEmailService } from "@/hooks/useEmailService";

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  cliente_nome?: string;
  lida: boolean;
  created_at: string;
}

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendNotificationEmail, isLoading: emailLoading } = useEmailService();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);

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

  const enviarNotificacaoPorEmail = async (notificacao: Notificacao) => {
    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Email do usuário não encontrado",
        variant: "destructive",
      });
      return;
    }

    await sendNotificationEmail(
      user.email,
      notificacao.mensagem,
      notificacao.cliente_nome
    );
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

  if (notificacoes.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
            {notificacaoNaoLidas.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {notificacaoNaoLidas.length}
              </Badge>
            )}
          </CardTitle>
          {notificacaoNaoLidas.length > 0 && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={marcarTodasComoLidas}
              disabled={loading}
            >
              <Check className="w-4 h-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notificacoes.map((notificacao) => (
            <Alert 
              key={notificacao.id} 
              className={`relative ${!notificacao.lida ? 'border-l-4 border-l-orange-500' : 'opacity-70'}`}
              variant={notificacao.tipo === 'PARCELAS_EM_ABERTO' ? 'destructive' : 'default'}
            >
              <AlertTriangle className="h-4 w-4" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{notificacao.titulo}</h4>
                      {!notificacao.lida && (
                        <Badge variant="secondary" className="text-xs">Nova</Badge>
                      )}
                    </div>
                    <AlertDescription>
                      {notificacao.mensagem}
                    </AlertDescription>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notificacao.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => enviarNotificacaoPorEmail(notificacao)}
                      disabled={emailLoading}
                      className="text-blue-600 hover:text-blue-700"
                      title="Enviar por email"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    {!notificacao.lida && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => marcarComoLida(notificacao.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};