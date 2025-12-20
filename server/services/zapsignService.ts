import type { ZapsignCreateDocRequest, ZapsignDocResponse, ZapsignSigner } from '@shared/schema';

const ZAPSIGN_API_URL = 'https://api.zapsign.com.br/api/v1';

function getApiToken(): string {
  const token = process.env.ZAPSIGN_API_TOKEN;
  if (!token) {
    throw new Error('ZAPSIGN_API_TOKEN not configured');
  }
  return token;
}

export async function createDocument(request: ZapsignCreateDocRequest): Promise<ZapsignDocResponse> {
  const token = getApiToken();
  
  const response = await fetch(`${ZAPSIGN_API_URL}/docs/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: request.name,
      url_pdf: request.url_pdf,
      base64_pdf: request.base64_pdf,
      signers: request.signers,
      lang: request.lang || 'pt-br',
      external_id: request.external_id || '',
      date_limit_to_sign: request.date_limit_to_sign,
      disable_signer_emails: request.disable_signer_emails || false,
      folder_path: request.folder_path || '/',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ZapSign API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function getDocument(documentToken: string): Promise<ZapsignDocResponse> {
  const token = getApiToken();
  
  const response = await fetch(`${ZAPSIGN_API_URL}/docs/${documentToken}/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ZapSign API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function listDocuments(page: number = 1): Promise<{ results: ZapsignDocResponse[]; count: number }> {
  const token = getApiToken();
  
  const response = await fetch(`${ZAPSIGN_API_URL}/docs/?page=${page}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ZapSign API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function deleteDocument(documentToken: string): Promise<void> {
  const token = getApiToken();
  
  const response = await fetch(`${ZAPSIGN_API_URL}/docs/${documentToken}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ZapSign API error: ${response.status} - ${errorText}`);
  }
}

export function buildSignerFromCliente(cliente: {
  nome: string;
  email?: string | null;
  telefone?: string | null;
  cpfCnpj?: string | null;
}, options?: {
  auth_mode?: string;
  send_automatic_email?: boolean;
  send_automatic_whatsapp?: boolean;
  require_cpf?: boolean;
}): ZapsignSigner {
  const telefone = cliente.telefone?.replace(/\D/g, '') || '';
  const phone_number = telefone.length >= 10 ? telefone.slice(-11) : '';
  
  return {
    name: cliente.nome,
    email: cliente.email || '',
    phone_country: '55',
    phone_number: phone_number,
    cpf: cliente.cpfCnpj?.replace(/\D/g, '') || '',
    auth_mode: options?.auth_mode || 'assinaturaTela',
    send_automatic_email: options?.send_automatic_email ?? false,
    send_automatic_whatsapp: options?.send_automatic_whatsapp ?? false,
    require_cpf: options?.require_cpf ?? true,
  };
}
