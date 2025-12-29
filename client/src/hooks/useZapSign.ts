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
  ordemAssinatura?: boolean; // OneClick
  additionalSigners?: AdditionalSignerParams[];
  witnesses?: WitnessParams[];
}

export function useZapSignCreateDocumentFromProcesso() {
  const createDocument = useZapSignCreateDocument();

  return useMutation({
    mutationFn: async (params: CreateDocumentFromProcessoParams): Promise<ZapsignDocResponse> => {
      const signers: any[] = []; // Use any to include OneClick fields
      let currentOrderGroup = 1;

      // Cliente (sempre primeiro se ordem ativa)
      const mainSigner = {
        name: params.clienteNome,
        email: params.clienteEmail || '',
        phone_country: params.clienteTelefone ? '55' : undefined,
        phone_number: params.clienteTelefone?.replace(/\D/g, '').slice(-11) || undefined,
        cpf: params.clienteCpfCnpj?.replace(/\D/g, '') || undefined,
        // OneClick
        qualification: 'parte',
        send_automatic_email: params.sendEmail ?? false,
        send_automatic_whatsapp: params.sendWhatsapp ?? false,
        order_group: params.ordemAssinatura ? currentOrderGroup++ : undefined,
      };
      signers.push(mainSigner);

      // Signatários adicionais
      if (params.additionalSigners && params.additionalSigners.length > 0) {
        for (const addSigner of params.additionalSigners) {
          if (addSigner.nome && addSigner.email) {
            const signer = {
              name: addSigner.nome,
              email: addSigner.email,
              phone_country: addSigner.telefone ? '55' : undefined,
              phone_number: addSigner.telefone?.replace(/\D/g, '').slice(-11) || undefined,
              cpf: addSigner.cpf_cnpj?.replace(/\D/g, '') || undefined,
              // OneClick
              qualification: 'parte',
              send_automatic_email: false,
              send_automatic_whatsapp: false,
              order_group: params.ordemAssinatura ? currentOrderGroup++ : undefined,
            };
            signers.push(signer);
          }
        }
      }

      // Testemunhas
      if (params.witnesses && params.witnesses.length > 0) {
        for (const witness of params.witnesses) {
          if (witness.nome && witness.email) {
            const witnessSigner = {
              name: witness.nome,
              email: witness.email,
              phone_country: '55',
              phone_number: '',
              cpf: witness.cpf?.replace(/\D/g, '') || '',
              // OneClick
              qualification: 'testemunha',
              send_automatic_email: false,
              send_automatic_whatsapp: false,
              order_group: params.ordemAssinatura ? currentOrderGroup++ : undefined,
            };
            signers.push(witnessSigner);
          }
        }
      }

      const request = {
        useOneClick: true, // SEMPRE OneClick
        name: params.documentName,
        url_pdf: params.pdfUrl,
        base64_pdf: params.pdfBase64,
        signers: signers,
        lang: 'pt-br',
        require_signature: true,
        signature_order_active: params.ordemAssinatura || false,
        external_id: params.processoId,
        date_limit_to_sign: params.dateLimitToSign,
        folder_path: '/facilita-adv/',
        // Email params for backend
        notifyEmail: true, // Enable custom emails
        clientName: params.clienteNome,
      };

      return createDocument.mutateAsync(request as any);
    },
  });
}
