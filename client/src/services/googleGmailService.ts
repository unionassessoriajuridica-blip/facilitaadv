import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (
    connectionSettings &&
    connectionSettings.settings.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token;
  }

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
    'https://' +
      hostname +
      '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        Accept: 'application/json',
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Send email
export async function sendEmail(emailData: {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
}) {
  try {
    const gmail = await getGmailClient();

    const headers = {
      'Content-Type': 'text/plain; charset="UTF-8"\r\n',
      MIME: 'Version: 1.0\r\n',
      'Content-Transfer-Encoding': '7bit\r\n',
      to: emailData.to.join(', '),
      subject: emailData.subject,
      ...(emailData.cc && { cc: emailData.cc.join(', ') }),
      ...(emailData.bcc && { bcc: emailData.bcc.join(', ') }),
    };

    const message = Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\r\n');

    const rawMessage = Buffer.from(`${message}\r\n\r\n${emailData.body}`)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    return res.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Get email list
export async function listEmails(query?: string, maxResults = 10) {
  try {
    const gmail = await getGmailClient();
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    });
    return res.data.messages || [];
  } catch (error) {
    console.error('Error listing emails:', error);
    throw error;
  }
}

// Get email details
export async function getEmailDetails(messageId: string) {
  try {
    const gmail = await getGmailClient();
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    return res.data;
  } catch (error) {
    console.error('Error getting email details:', error);
    throw error;
  }
}

// Delete email
export async function deleteEmail(messageId: string) {
  try {
    const gmail = await getGmailClient();
    await gmail.users.messages.delete({
      userId: 'me',
      id: messageId,
    });
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
}
