import { google, gmail_v1 } from 'googleapis';
import { googleSystemAuthService } from './googleSystemAuthService';

async function getGmailClient(): Promise<gmail_v1.Gmail> {
  const oauth2Client = await googleSystemAuthService.getOAuth2ClientWithToken();
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function isConnected(): Promise<boolean> {
  return googleSystemAuthService.isConnected();
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

function createRawEmail(options: EmailOptions, fromEmail: string): string {
  const toAddresses = Array.isArray(options.to) ? options.to.join(', ') : options.to;
  const ccAddresses = options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : '';
  const bccAddresses = options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : '';
  
  const boundary = 'boundary_' + Date.now().toString(16);
  
  let emailLines: string[] = [];
  emailLines.push(`From: ${fromEmail}`);
  emailLines.push(`To: ${toAddresses}`);
  if (ccAddresses) emailLines.push(`Cc: ${ccAddresses}`);
  if (bccAddresses) emailLines.push(`Bcc: ${bccAddresses}`);
  if (options.replyTo) emailLines.push(`Reply-To: ${options.replyTo}`);
  emailLines.push(`Subject: =?UTF-8?B?${Buffer.from(options.subject).toString('base64')}?=`);
  emailLines.push('MIME-Version: 1.0');
  
  if (options.isHtml) {
    emailLines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    emailLines.push('');
    emailLines.push(`--${boundary}`);
    emailLines.push('Content-Type: text/plain; charset=UTF-8');
    emailLines.push('Content-Transfer-Encoding: base64');
    emailLines.push('');
    emailLines.push(Buffer.from(options.body.replace(/<[^>]*>/g, '')).toString('base64'));
    emailLines.push(`--${boundary}`);
    emailLines.push('Content-Type: text/html; charset=UTF-8');
    emailLines.push('Content-Transfer-Encoding: base64');
    emailLines.push('');
    emailLines.push(Buffer.from(options.body).toString('base64'));
    emailLines.push(`--${boundary}--`);
  } else {
    emailLines.push('Content-Type: text/plain; charset=UTF-8');
    emailLines.push('Content-Transfer-Encoding: base64');
    emailLines.push('');
    emailLines.push(Buffer.from(options.body).toString('base64'));
  }
  
  const rawEmail = emailLines.join('\r\n');
  return Buffer.from(rawEmail).toString('base64url');
}

export async function sendEmail(options: EmailOptions): Promise<{ id: string; threadId: string }> {
  const gmail = await getGmailClient();
  
  const profile = await gmail.users.getProfile({ userId: 'me' });
  const fromEmail = profile.data.emailAddress || '';
  
  const raw = createRawEmail(options, fromEmail);
  
  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw,
    },
  });
  
  return {
    id: result.data.id || '',
    threadId: result.data.threadId || '',
  };
}

export async function listMessages(maxResults: number = 20, query?: string): Promise<gmail_v1.Schema$Message[]> {
  const gmail = await getGmailClient();
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: query,
  });
  
  const messages: gmail_v1.Schema$Message[] = [];
  
  if (response.data.messages) {
    for (const msg of response.data.messages.slice(0, maxResults)) {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date'],
      });
      messages.push(fullMessage.data);
    }
  }
  
  return messages;
}

export async function getMessage(messageId: string): Promise<gmail_v1.Schema$Message> {
  const gmail = await getGmailClient();
  
  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });
  
  return response.data;
}

export async function getProfile(): Promise<{ email: string; messagesTotal: number }> {
  const gmail = await getGmailClient();
  
  const profile = await gmail.users.getProfile({ userId: 'me' });
  
  return {
    email: profile.data.emailAddress || '',
    messagesTotal: profile.data.messagesTotal || 0,
  };
}

export const googleGmailService = {
  isConnected,
  sendEmail,
  listMessages,
  getMessage,
  getProfile,
};
