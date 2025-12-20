import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        Accept: 'application/json',
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email,
  };
}

export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail || 'FacilitaAdv <noreply@facilita.adv.br>',
  };
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions) {
  const { client, fromEmail } = await getResendClient();

  const result = await client.emails.send({
    from: fromEmail,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
  });

  return result;
}

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">FacilitaAdv</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Sistema de Gestao Juridica</p>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      ${content}
    </div>
    <div style="text-align: center; padding: 20px; color: #71717a; font-size: 12px;">
      <p style="margin: 0;">Este e um email automatico do FacilitaAdv.</p>
      <p style="margin: 5px 0 0 0;">Por favor, nao responda diretamente a este email.</p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  documentSignatureRequest: (data: { clientName: string; documentName: string; signerName: string; signatureUrl: string }) => ({
    subject: `[FacilitaAdv] Documento para assinatura - ${data.documentName}`,
    html: baseTemplate(`
      <h2 style="color: #1e293b; margin: 0 0 20px 0;">Documento para Assinatura</h2>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 15px 0;">
        Ola <strong>${data.signerName}</strong>,
      </p>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
        Voce recebeu um documento para assinatura digital referente ao cliente <strong>${data.clientName}</strong>.
      </p>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
        <p style="color: #475569; margin: 0;"><strong>Documento:</strong> ${data.documentName}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.signatureUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Assinar Documento
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 14px; margin: 20px 0 0 0;">
        Este link expira em 7 dias. Por favor, assine o documento o mais breve possivel.
      </p>
    `),
  }),

  documentSigned: (data: { clientName: string; documentName: string; signerName: string; signedAt: string }) => ({
    subject: `[FacilitaAdv] Documento assinado - ${data.documentName}`,
    html: baseTemplate(`
      <h2 style="color: #1e293b; margin: 0 0 20px 0;">Documento Assinado com Sucesso</h2>
      <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 0 0 20px 0; border-left: 4px solid #22c55e;">
        <p style="color: #166534; margin: 0; font-weight: bold;">O documento foi assinado!</p>
      </div>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 15px 0;">
        O documento <strong>${data.documentName}</strong> do cliente <strong>${data.clientName}</strong> foi assinado por <strong>${data.signerName}</strong>.
      </p>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #475569; margin: 0 0 8px 0;"><strong>Data da assinatura:</strong> ${data.signedAt}</p>
        <p style="color: #475569; margin: 0;"><strong>Assinante:</strong> ${data.signerName}</p>
      </div>
    `),
  }),

  deadlineReminder: (data: { processNumber: string; clientName: string; deadline: string; description: string; daysRemaining: number }) => ({
    subject: `[FacilitaAdv] Lembrete de prazo - ${data.processNumber}`,
    html: baseTemplate(`
      <h2 style="color: #1e293b; margin: 0 0 20px 0;">Lembrete de Prazo</h2>
      <div style="background: ${data.daysRemaining <= 1 ? '#fef2f2' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin: 0 0 20px 0; border-left: 4px solid ${data.daysRemaining <= 1 ? '#ef4444' : '#f59e0b'};">
        <p style="color: ${data.daysRemaining <= 1 ? '#991b1b' : '#92400e'}; margin: 0; font-weight: bold;">
          ${data.daysRemaining <= 0 ? 'Prazo vencido!' : data.daysRemaining === 1 ? 'Prazo vence amanha!' : `Faltam ${data.daysRemaining} dias para o prazo`}
        </p>
      </div>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 15px 0;">
        Existe um prazo proximo para o processo <strong>${data.processNumber}</strong>.
      </p>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #475569; margin: 0 0 8px 0;"><strong>Processo:</strong> ${data.processNumber}</p>
        <p style="color: #475569; margin: 0 0 8px 0;"><strong>Cliente:</strong> ${data.clientName}</p>
        <p style="color: #475569; margin: 0 0 8px 0;"><strong>Prazo:</strong> ${data.deadline}</p>
        <p style="color: #475569; margin: 0;"><strong>Descricao:</strong> ${data.description}</p>
      </div>
    `),
  }),

  paymentReminder: (data: { clientName: string; amount: string; dueDate: string; description: string }) => ({
    subject: `[FacilitaAdv] Lembrete de pagamento - ${data.clientName}`,
    html: baseTemplate(`
      <h2 style="color: #1e293b; margin: 0 0 20px 0;">Lembrete de Pagamento</h2>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 15px 0;">
        Ola <strong>${data.clientName}</strong>,
      </p>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
        Este e um lembrete sobre um pagamento pendente.
      </p>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
        <p style="color: #475569; margin: 0 0 8px 0;"><strong>Valor:</strong> ${data.amount}</p>
        <p style="color: #475569; margin: 0 0 8px 0;"><strong>Vencimento:</strong> ${data.dueDate}</p>
        <p style="color: #475569; margin: 0;"><strong>Referente a:</strong> ${data.description}</p>
      </div>
      <p style="color: #94a3b8; font-size: 14px; margin: 20px 0 0 0;">
        Em caso de duvidas, entre em contato conosco.
      </p>
    `),
  }),

  userInvitation: (data: { recipientName: string; inviterName: string; permissions: string; acceptUrl: string }) => ({
    subject: `[FacilitaAdv] Convite para acessar o sistema`,
    html: baseTemplate(`
      <h2 style="color: #1e293b; margin: 0 0 20px 0;">Voce foi convidado!</h2>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 15px 0;">
        Ola <strong>${data.recipientName}</strong>,
      </p>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
        Voce foi convidado por <strong>${data.inviterName}</strong> para acessar o sistema FacilitaAdv.
      </p>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 10px 0;">Suas permissoes:</h3>
        <p style="color: #475569; margin: 0;">${data.permissions}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Aceitar Convite
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 14px; margin: 20px 0 0 0;">
        Este convite expira em 7 dias.
      </p>
    `),
  }),

  taskReminder: (data: { taskTitle: string; processNumber: string; clientName: string; dueDate: string; daysRemaining: number }) => ({
    subject: `[FacilitaAdv] Lembrete de tarefa - ${data.taskTitle}`,
    html: baseTemplate(`
      <h2 style="color: #1e293b; margin: 0 0 20px 0;">Lembrete de Tarefa</h2>
      <div style="background: ${data.daysRemaining <= 1 ? '#fef2f2' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin: 0 0 20px 0; border-left: 4px solid ${data.daysRemaining <= 1 ? '#ef4444' : '#f59e0b'};">
        <p style="color: ${data.daysRemaining <= 1 ? '#991b1b' : '#92400e'}; margin: 0; font-weight: bold;">
          ${data.daysRemaining <= 0 ? 'Tarefa vencida!' : data.daysRemaining === 1 ? 'Tarefa vence amanha!' : `Faltam ${data.daysRemaining} dias`}
        </p>
      </div>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #475569; margin: 0 0 8px 0;"><strong>Tarefa:</strong> ${data.taskTitle}</p>
        <p style="color: #475569; margin: 0 0 8px 0;"><strong>Processo:</strong> ${data.processNumber}</p>
        <p style="color: #475569; margin: 0 0 8px 0;"><strong>Cliente:</strong> ${data.clientName}</p>
        <p style="color: #475569; margin: 0;"><strong>Vencimento:</strong> ${data.dueDate}</p>
      </div>
    `),
  }),
};

export async function sendDocumentSignatureRequest(data: Parameters<typeof emailTemplates.documentSignatureRequest>[0] & { to: string }) {
  const template = emailTemplates.documentSignatureRequest(data);
  return sendEmail({ to: data.to, ...template });
}

export async function sendDocumentSignedNotification(data: Parameters<typeof emailTemplates.documentSigned>[0] & { to: string }) {
  const template = emailTemplates.documentSigned(data);
  return sendEmail({ to: data.to, ...template });
}

export async function sendDeadlineReminder(data: Parameters<typeof emailTemplates.deadlineReminder>[0] & { to: string }) {
  const template = emailTemplates.deadlineReminder(data);
  return sendEmail({ to: data.to, ...template });
}

export async function sendPaymentReminder(data: Parameters<typeof emailTemplates.paymentReminder>[0] & { to: string }) {
  const template = emailTemplates.paymentReminder(data);
  return sendEmail({ to: data.to, ...template });
}

export async function sendUserInvitation(data: Parameters<typeof emailTemplates.userInvitation>[0] & { to: string }) {
  const template = emailTemplates.userInvitation(data);
  return sendEmail({ to: data.to, ...template });
}

export async function sendTaskReminder(data: Parameters<typeof emailTemplates.taskReminder>[0] & { to: string }) {
  const template = emailTemplates.taskReminder(data);
  return sendEmail({ to: data.to, ...template });
}
