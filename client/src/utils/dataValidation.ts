// Utility functions for data validation and cleaning

export const cleanString = (value: any): string | null => {
  if (!value) return null;
  const cleaned = value.toString().trim();
  return cleaned === '' ? null : cleaned;
};

export const cleanPhone = (value: any): string | null => {
  if (!value) return null;
  const phone = value.toString().replace(/[^\d]/g, '');
  return phone.length >= 10 ? phone : null;
};

export const validateEmail = (email: string): boolean => {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCpfCnpj = (value: string): boolean => {
  if (!value) return true; // CPF/CNPJ is optional
  const cleaned = value.replace(/[^\d]/g, '');
  return cleaned.length === 11 || cleaned.length === 14;
};

export const formatName = (name: string): string => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export interface ValidationError {
  line: number;
  field: string;
  value: any;
  message: string;
}

export interface ProcessedRow {
  line: number;
  data: {
    // Dados do Cliente
    nome: string;
    email?: string;
    telefone?: string;
    cpf_cnpj?: string;
    rg?: string;
    data_nascimento?: string;
    endereco?: string;
    bairro?: string;
    cidade?: string;
    cep?: string;
    // Dados do Processo
    numero_processo?: string;
    tipo_processo?: string;
    prazo?: string;
    descricao?: string;
    cliente_preso?: boolean;
    // Dados Financeiros
    valor_honorarios?: number;
    valor_entrada?: number;
    data_entrada?: string;
    quantidade_parcelas?: number;
    data_primeiro_vencimento?: string;
    incluir_tmp?: boolean;
    valor_tmp?: number;
    vencimento_tmp?: string;
    quantidade_meses_tmp?: number;
    // Responsável Financeiro
    responsavel_nome?: string;
    responsavel_rg?: string;
    responsavel_cpf?: string;
    responsavel_data_nascimento?: string;
    responsavel_telefone?: string;
    responsavel_email?: string;
    responsavel_endereco?: string;
    responsavel_cep?: string;
  };
  errors: ValidationError[];
}

// Helper function to parse currency values
export const parseCurrencyFromExcel = (value: any): number | null => {
  if (!value) return null;
  const cleanValue = value.toString().replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? null : parsed;
};

// Helper function to parse boolean values
export const parseBoolean = (value: any): boolean => {
  if (!value) return false;
  const str = value.toString().toLowerCase();
  return str === 'sim' || str === 'yes' || str === 'true' || str === '1' || str === 'verdadeiro';
};

export const processExcelRow = (row: any, index: number): ProcessedRow => {
  const lineNum = index + 2; // +2 because line 1 is header and index starts at 0
  const errors: ValidationError[] = [];
  
  console.log(`Processando linha ${lineNum}:`, row);
  
  // Define possible column names for each field
  const fieldMappings = {
    // Dados do Cliente
    nome: ['Nome', 'nome', 'NOME', 'Name', 'Cliente'],
    email: ['Email', 'email', 'EMAIL', 'E-mail', 'e-mail'],
    telefone: ['Telefone', 'telefone', 'TELEFONE', 'Phone', 'Celular'],
    cpf_cnpj: ['CPF/CNPJ', 'CPF', 'cpf', 'CNPJ', 'cnpj', 'Documento'],
    rg: ['RG', 'rg', 'Identidade'],
    data_nascimento: ['Data Nascimento', 'Data de Nascimento', 'Nascimento', 'data_nascimento'],
    endereco: ['Endereço', 'endereco', 'Endereco', 'Address', 'Rua'],
    bairro: ['Bairro', 'bairro', 'BAIRRO'],
    cidade: ['Cidade', 'cidade', 'CIDADE', 'City'],
    cep: ['CEP', 'cep', 'Codigo Postal'],
    
    // Dados do Processo
    numero_processo: ['Número do Processo', 'Numero do Processo', 'numero_processo', 'Processo'],
    tipo_processo: ['Tipo de Processo', 'Área do Processo', 'tipo_processo', 'area_processo', 'Area'],
    prazo: ['Prazo', 'prazo', 'Data Prazo', 'Vencimento'],
    descricao: ['Descrição', 'descricao', 'Observações', 'observacoes'],
    cliente_preso: ['Cliente Preso', 'cliente_preso', 'Preso', 'Prisão'],
    
    // Dados Financeiros
    valor_honorarios: ['Valor Honorários', 'valor_honorarios', 'Honorarios', 'Valor Total'],
    valor_entrada: ['Valor Entrada', 'valor_entrada', 'Entrada', 'Sinal'],
    data_entrada: ['Data Entrada', 'data_entrada', 'Vencimento Entrada'],
    quantidade_parcelas: ['Quantidade Parcelas', 'quantidade_parcelas', 'Parcelas', 'Qtd Parcelas'],
    data_primeiro_vencimento: ['Data Primeiro Vencimento', 'data_primeiro_vencimento', 'Primeiro Vencimento'],
    incluir_tmp: ['Incluir TMP', 'incluir_tmp', 'TMP', 'Taxa Manutencao'],
    valor_tmp: ['Valor TMP', 'valor_tmp', 'TMP Valor'],
    vencimento_tmp: ['Vencimento TMP', 'vencimento_tmp', 'Data TMP'],
    quantidade_meses_tmp: ['Quantidade Meses TMP', 'quantidade_meses_tmp', 'Meses TMP'],
    
    // Responsável Financeiro
    responsavel_nome: ['Responsável Nome', 'responsavel_nome', 'Nome Responsavel'],
    responsavel_rg: ['Responsável RG', 'responsavel_rg', 'RG Responsavel'],
    responsavel_cpf: ['Responsável CPF', 'responsavel_cpf', 'CPF Responsavel'],
    responsavel_data_nascimento: ['Responsável Data Nascimento', 'responsavel_data_nascimento'],
    responsavel_telefone: ['Responsável Telefone', 'responsavel_telefone', 'Telefone Responsavel'],
    responsavel_email: ['Responsável Email', 'responsavel_email', 'Email Responsavel'],
    responsavel_endereco: ['Responsável Endereço', 'responsavel_endereco', 'Endereco Responsavel'],
    responsavel_cep: ['Responsável CEP', 'responsavel_cep', 'CEP Responsavel']
  };
  
  // Function to find field value by trying multiple column names
  const findFieldValue = (fieldNames: string[]) => {
    for (const fieldName of fieldNames) {
      if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
        return row[fieldName];
      }
    }
    return null;
  };
  
  // Extract all data fields
  const extractedData = {
    // Dados do Cliente
    nome: cleanString(findFieldValue(fieldMappings.nome)),
    email: cleanString(findFieldValue(fieldMappings.email)),
    telefone: cleanPhone(findFieldValue(fieldMappings.telefone)),
    cpf_cnpj: cleanString(findFieldValue(fieldMappings.cpf_cnpj)),
    rg: cleanString(findFieldValue(fieldMappings.rg)),
    data_nascimento: cleanString(findFieldValue(fieldMappings.data_nascimento)),
    endereco: cleanString(findFieldValue(fieldMappings.endereco)),
    bairro: cleanString(findFieldValue(fieldMappings.bairro)),
    cidade: cleanString(findFieldValue(fieldMappings.cidade)),
    cep: cleanString(findFieldValue(fieldMappings.cep)),
    
    // Dados do Processo
    numero_processo: cleanString(findFieldValue(fieldMappings.numero_processo)),
    tipo_processo: cleanString(findFieldValue(fieldMappings.tipo_processo)),
    prazo: cleanString(findFieldValue(fieldMappings.prazo)),
    descricao: cleanString(findFieldValue(fieldMappings.descricao)),
    cliente_preso: parseBoolean(findFieldValue(fieldMappings.cliente_preso)),
    
    // Dados Financeiros
    valor_honorarios: parseCurrencyFromExcel(findFieldValue(fieldMappings.valor_honorarios)),
    valor_entrada: parseCurrencyFromExcel(findFieldValue(fieldMappings.valor_entrada)),
    data_entrada: cleanString(findFieldValue(fieldMappings.data_entrada)),
    quantidade_parcelas: parseInt(findFieldValue(fieldMappings.quantidade_parcelas)) || null,
    data_primeiro_vencimento: cleanString(findFieldValue(fieldMappings.data_primeiro_vencimento)),
    incluir_tmp: parseBoolean(findFieldValue(fieldMappings.incluir_tmp)),
    valor_tmp: parseCurrencyFromExcel(findFieldValue(fieldMappings.valor_tmp)),
    vencimento_tmp: cleanString(findFieldValue(fieldMappings.vencimento_tmp)),
    quantidade_meses_tmp: parseInt(findFieldValue(fieldMappings.quantidade_meses_tmp)) || null,
    
    // Responsável Financeiro
    responsavel_nome: cleanString(findFieldValue(fieldMappings.responsavel_nome)),
    responsavel_rg: cleanString(findFieldValue(fieldMappings.responsavel_rg)),
    responsavel_cpf: cleanString(findFieldValue(fieldMappings.responsavel_cpf)),
    responsavel_data_nascimento: cleanString(findFieldValue(fieldMappings.responsavel_data_nascimento)),
    responsavel_telefone: cleanPhone(findFieldValue(fieldMappings.responsavel_telefone)),
    responsavel_email: cleanString(findFieldValue(fieldMappings.responsavel_email)),
    responsavel_endereco: cleanString(findFieldValue(fieldMappings.responsavel_endereco)),
    responsavel_cep: cleanString(findFieldValue(fieldMappings.responsavel_cep))
  };
  
  console.log(`Dados extraídos linha ${lineNum}:`, extractedData);

  // Validate required fields
  if (!extractedData.nome) {
    console.log(`Erro linha ${lineNum}: Nome vazio`);
    errors.push({
      line: lineNum,
      field: 'nome',
      value: 'vazio',
      message: 'Nome é obrigatório'
    });
  }

  // Validate email format (only if provided)
  if (extractedData.email && !validateEmail(extractedData.email)) {
    console.log(`Erro linha ${lineNum}: Email inválido:`, extractedData.email);
    errors.push({
      line: lineNum,
      field: 'email',
      value: extractedData.email,
      message: 'Email em formato inválido'
    });
  }

  // Validate CPF/CNPJ format (only if provided)
  if (extractedData.cpf_cnpj && !validateCpfCnpj(extractedData.cpf_cnpj)) {
    console.log(`Erro linha ${lineNum}: CPF/CNPJ inválido:`, extractedData.cpf_cnpj);
    errors.push({
      line: lineNum,
      field: 'cpf_cnpj',
      value: extractedData.cpf_cnpj,
      message: 'CPF/CNPJ deve ter 11 ou 14 dígitos'
    });
  }

  // Validate responsavel email if provided
  if (extractedData.responsavel_email && !validateEmail(extractedData.responsavel_email)) {
    console.log(`Erro linha ${lineNum}: Email do responsável inválido:`, extractedData.responsavel_email);
    errors.push({
      line: lineNum,
      field: 'responsavel_email',
      value: extractedData.responsavel_email,
      message: 'Email do responsável em formato inválido'
    });
  }

  const result = {
    line: lineNum,
    data: {
      nome: extractedData.nome ? formatName(extractedData.nome) : '',
      email: extractedData.email || undefined,
      telefone: extractedData.telefone || undefined,
      cpf_cnpj: extractedData.cpf_cnpj || undefined,
      rg: extractedData.rg || undefined,
      data_nascimento: extractedData.data_nascimento || undefined,
      endereco: extractedData.endereco || undefined,
      bairro: extractedData.bairro || undefined,
      cidade: extractedData.cidade || undefined,
      cep: extractedData.cep || undefined,
      numero_processo: extractedData.numero_processo || undefined,
      tipo_processo: extractedData.tipo_processo || undefined,
      prazo: extractedData.prazo || undefined,
      descricao: extractedData.descricao || undefined,
      cliente_preso: extractedData.cliente_preso || undefined,
      valor_honorarios: extractedData.valor_honorarios || undefined,
      valor_entrada: extractedData.valor_entrada || undefined,
      data_entrada: extractedData.data_entrada || undefined,
      quantidade_parcelas: extractedData.quantidade_parcelas || undefined,
      data_primeiro_vencimento: extractedData.data_primeiro_vencimento || undefined,
      incluir_tmp: extractedData.incluir_tmp || undefined,
      valor_tmp: extractedData.valor_tmp || undefined,
      vencimento_tmp: extractedData.vencimento_tmp || undefined,
      quantidade_meses_tmp: extractedData.quantidade_meses_tmp || undefined,
      responsavel_nome: extractedData.responsavel_nome || undefined,
      responsavel_rg: extractedData.responsavel_rg || undefined,
      responsavel_cpf: extractedData.responsavel_cpf || undefined,
      responsavel_data_nascimento: extractedData.responsavel_data_nascimento || undefined,
      responsavel_telefone: extractedData.responsavel_telefone || undefined,
      responsavel_email: extractedData.responsavel_email || undefined,
      responsavel_endereco: extractedData.responsavel_endereco || undefined,
      responsavel_cep: extractedData.responsavel_cep || undefined,
    },
    errors
  };
  
  console.log(`Resultado linha ${lineNum}:`, result);
  return result;
};