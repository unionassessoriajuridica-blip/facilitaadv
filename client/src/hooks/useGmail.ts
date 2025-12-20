import * as React from "react";
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface EmailData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: File[];
}

interface EmailThread {
  id: string;
  subject: string;
  snippet: string;
  date: Date;
  from: string;
  unread: boolean;
}

export const useGmail = (accessToken: string | null) => {
  const [loading, setLoading] = useState(false);
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const { toast } = useToast();

  const sendEmail = async (emailData: EmailData) => {
    if (!accessToken) {
      toast({
        title: "Erro",
        description: "Token de acesso não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      // Criar o corpo do email no formato RFC 2822
      const boundary = '==boundary==';
      let message = '';
      
      // Headers
      message += `To: ${emailData.to.join(', ')}\r\n`;
      if (emailData.cc && emailData.cc.length > 0) {
        message += `Cc: ${emailData.cc.join(', ')}\r\n`;
      }
      if (emailData.bcc && emailData.bcc.length > 0) {
        message += `Bcc: ${emailData.bcc.join(', ')}\r\n`;
      }
      message += `Subject: ${emailData.subject}\r\n`;
      message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
      
      // Corpo do email
      message += `--${boundary}\r\n`;
      message += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
      message += `${emailData.body}\r\n\r\n`;

      // Anexos (se houver)
      if (emailData.attachments && emailData.attachments.length > 0) {
        for (const attachment of emailData.attachments) {
          const base64Data = await fileToBase64(attachment);
          message += `--${boundary}\r\n`;
          message += `Content-Type: ${attachment.type}\r\n`;
          message += `Content-Disposition: attachment; filename="${attachment.name}"\r\n`;
          message += `Content-Transfer-Encoding: base64\r\n\r\n`;
          message += `${base64Data}\r\n\r\n`;
        }
      }
      
      message += `--${boundary}--`;

      // Codificar em base64 URL-safe
      const encodedMessage = btoa(message)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch(
        'https://www.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: encodedMessage
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      toast({
        title: "Email enviado!",
        description: "Seu email foi enviado com sucesso através do Gmail.",
      });

      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o email. Verifique suas permissões.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadThreads = async (maxResults: number = 20) => {
    if (!accessToken) {
      toast({
        title: "Erro",
        description: "Token de acesso não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.threads) {
        // Buscar detalhes de cada thread
        const threadDetails = await Promise.all(
          data.threads.slice(0, 10).map(async (thread: any) => {
            const threadResponse = await fetch(
              `https://www.googleapis.com/gmail/v1/users/me/threads/${thread.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              }
            );
            return threadResponse.json();
          })
        );

        const formattedThreads: EmailThread[] = threadDetails.map((thread: any) => {
          const firstMessage = thread.messages[0];
          const headers = firstMessage.payload.headers;
          
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'Sem assunto';
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Desconhecido';
          const date = new Date(parseInt(firstMessage.internalDate));
          
          return {
            id: thread.id,
            subject,
            snippet: thread.snippet || '',
            date,
            from,
            unread: firstMessage.labelIds?.includes('UNREAD') || false
          };
        });

        setThreads(formattedThreads);
      }
    } catch (error) {
      console.error('Erro ao carregar emails:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os emails do Gmail.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove o prefixo "data:tipo/subtipo;base64,"
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  return {
    loading,
    threads,
    sendEmail,
    loadThreads
  };
};