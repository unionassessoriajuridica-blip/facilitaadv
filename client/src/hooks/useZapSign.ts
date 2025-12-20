import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ZapsignCreateDocRequest, ZapsignDocResponse, ZapsignSigner } from '@shared/schema';

const API_BASE = '/api/zapsign';

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

export function useZapSignCreateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: ZapsignCreateDocRequest): Promise<ZapsignDocResponse> => {
      return apiRequest<ZapsignDocResponse>(`${API_BASE}/documents`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zapsign', 'documents'] });
    },
  });
}

export function useZapSignDocument(token: string | null) {
  return useQuery({
    queryKey: ['zapsign', 'documents', token],
    queryFn: async (): Promise<ZapsignDocResponse> => {
      if (!token) throw new Error('Token is required');
      return apiRequest<ZapsignDocResponse>(`${API_BASE}/documents/${token}`);
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 2,
  });
}

export function useZapSignDocuments(page: number = 1) {
  return useQuery({
    queryKey: ['zapsign', 'documents', 'list', page],
    queryFn: async (): Promise<{ results: ZapsignDocResponse[]; count: number }> => {
      return apiRequest<{ results: ZapsignDocResponse[]; count: number }>(`${API_BASE}/documents?page=${page}`);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useZapSignDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (token: string): Promise<{ success: boolean }> => {
      return apiRequest<{ success: boolean }>(`${API_BASE}/documents/${token}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zapsign', 'documents'] });
    },
  });
}

export function useZapSignBuildSigner() {
  return useMutation({
    mutationFn: async (params: {
      cliente: {
        nome: string;
        email?: string | null;
        telefone?: string | null;
        cpfCnpj?: string | null;
      };
      options?: {
        auth_mode?: string;
        send_automatic_email?: boolean;
        send_automatic_whatsapp?: boolean;
        require_cpf?: boolean;
      };
    }): Promise<ZapsignSigner> => {
      return apiRequest<ZapsignSigner>(`${API_BASE}/build-signer`, {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  });
}

export interface AdditionalSignerParams {
  nome: string;
  email: string;
  telefone?: string;
  cpf_cnpj?: string;
}

export interface WitnessParams {
  nome: string;
  email: string;
  cpf?: string;
}

export interface CreateDocumentFromProcessoParams {
  processoId: string;
  clienteNome: string;
  clienteEmail?: string | null;
  clienteTelefone?: string | null;
  clienteCpfCnpj?: string | null;
  documentName: string;
  pdfUrl?: string;
  pdfBase64?: string;
  sendEmail?: boolean;
  sendWhatsapp?: boolean;
  dateLimitToSign?: string;
  additionalSigners?: AdditionalSignerParams[];
  witnesses?: WitnessParams[];
}

export function useZapSignCreateDocumentFromProcesso() {
  const createDocument = useZapSignCreateDocument();
  
  return useMutation({
    mutationFn: async (params: CreateDocumentFromProcessoParams): Promise<ZapsignDocResponse> => {
      const signers: ZapsignSigner[] = [];
      
      const mainSigner: ZapsignSigner = {
        name: params.clienteNome,
        email: params.clienteEmail || '',
        phone_country: '55',
        phone_number: params.clienteTelefone?.replace(/\D/g, '').slice(-11) || '',
        cpf: params.clienteCpfCnpj?.replace(/\D/g, '') || '',
        auth_mode: 'assinaturaTela',
        send_automatic_email: params.sendEmail ?? false,
        send_automatic_whatsapp: params.sendWhatsapp ?? false,
        require_cpf: true,
      };
      signers.push(mainSigner);

      if (params.additionalSigners && params.additionalSigners.length > 0) {
        for (const addSigner of params.additionalSigners) {
          if (addSigner.nome && addSigner.email) {
            const signer: ZapsignSigner = {
              name: addSigner.nome,
              email: addSigner.email,
              phone_country: '55',
              phone_number: addSigner.telefone?.replace(/\D/g, '').slice(-11) || '',
              cpf: addSigner.cpf_cnpj?.replace(/\D/g, '') || '',
              auth_mode: 'assinaturaTela',
              send_automatic_email: true,
              send_automatic_whatsapp: false,
              require_cpf: false,
            };
            signers.push(signer);
          }
        }
      }

      if (params.witnesses && params.witnesses.length > 0) {
        for (const witness of params.witnesses) {
          if (witness.nome && witness.email) {
            const witnessSigner: ZapsignSigner = {
              name: `[Testemunha] ${witness.nome}`,
              email: witness.email,
              phone_country: '55',
              phone_number: '',
              cpf: witness.cpf?.replace(/\D/g, '') || '',
              auth_mode: 'assinaturaTela',
              send_automatic_email: true,
              send_automatic_whatsapp: false,
              require_cpf: false,
            };
            signers.push(witnessSigner);
          }
        }
      }

      const request: ZapsignCreateDocRequest = {
        name: params.documentName,
        url_pdf: params.pdfUrl,
        base64_pdf: params.pdfBase64,
        signers: signers,
        lang: 'pt-br',
        external_id: params.processoId,
        date_limit_to_sign: params.dateLimitToSign,
        folder_path: '/facilita-adv/',
      };

      return createDocument.mutateAsync(request);
    },
  });
}
