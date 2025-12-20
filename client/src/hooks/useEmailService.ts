import * as React from "react";
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailData {
  to: string;
  subject: string;
  message: string;
  type?: 'notification' | 'reminder' | 'report';
  clienteName?: string;
}

export const useEmailService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendEmail = async (emailData: EmailData) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "O email foi enviado com sucesso",
      });

      return { success: true, data };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o email",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const sendNotificationEmail = async (to: string, message: string, clienteName?: string) => {
    return sendEmail({
      to,
      subject: 'Notificação do Sistema Jurídico',
      message,
      type: 'notification',
      clienteName
    });
  };

  const sendReminderEmail = async (to: string, message: string, clienteName?: string) => {
    return sendEmail({
      to,
      subject: 'Lembrete de Prazo - Sistema Jurídico',
      message,
      type: 'reminder',
      clienteName
    });
  };

  const sendReportEmail = async (to: string, message: string) => {
    return sendEmail({
      to,
      subject: 'Relatório - Sistema Jurídico',
      message,
      type: 'report'
    });
  };

  return {
    sendEmail,
    sendNotificationEmail,
    sendReminderEmail,
    sendReportEmail,
    isLoading
  };
};