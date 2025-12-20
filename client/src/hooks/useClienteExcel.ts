import * as React from "react";
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { processExcelRow, ValidationError } from '@/utils/dataValidation';

interface ImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedRows: number;
  duplicatesSkipped: number;
  processesCreated: number;
  financialRecordsCreated: number;
  responsaveisCreated: number;
  errors: ValidationError[];
}

export const useClienteExcel = () => {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const downloadClientesExcel = async () => {
    console.log('Iniciando download dos clientes');
    setLoading(true);
    try {
      // Buscar todos os clientes
      const { data: clientes, error } = await supabase
        .from('clientes')
        .select('nome, email, telefone, cpf_cnpj, endereco, created_at')
        .order('nome');

      if (error) throw error;

      // Preparar dados para Excel
      const excelData = clientes.map(cliente => ({
        'Nome': cliente.nome,
        'Email': cliente.email || '',
        'Telefone': cliente.telefone || '',
        'CPF/CNPJ': cliente.cpf_cnpj || '',
        'Endereço': cliente.endereco || '',
        'Data Cadastro': cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('pt-BR') : ''
      }));

      // Criar planilha
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      
      // Ajustar larguras das colunas
      const columnWidths = [
        { wch: 30 }, // Nome
        { wch: 25 }, // Email
        { wch: 15 }, // Telefone
        { wch: 18 }, // CPF/CNPJ
        { wch: 40 }, // Endereço
        { wch: 12 }, // Data Cadastro
      ];
      worksheet['!cols'] = columnWidths;

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

      // Gerar arquivo Excel
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // Fazer download
      const fileName = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);

      toast({
        title: 'Download realizado',
        description: `Arquivo ${fileName} baixado com sucesso`,
      });

    } catch (error: any) {
      console.error('Error downloading Excel:', error);
      toast({
        title: 'Erro no download',
        description: error.message || 'Falha ao gerar arquivo Excel',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadClientesExcel = async (file: File): Promise<ImportResult | null> => {
    console.log('Iniciando upload do Excel:', file.name);
    setImporting(true);
    setProgress(0);
    
    try {
      // Read Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData.length) {
        throw new Error('Arquivo Excel está vazio');
      }

      setProgress(10);

      // Process and validate all rows
      const processedRows = jsonData.map((row, index) => processExcelRow(row, index));
      const validRows = processedRows.filter(row => row.errors.length === 0);
      const invalidRows = processedRows.filter(row => row.errors.length > 0);
      
      setProgress(30);

      if (validRows.length === 0) {
        const allErrors = processedRows.flatMap(row => row.errors);
        await generateErrorReport(allErrors, file.name);
        
        toast({
          title: 'Nenhum registro válido',
          description: `Todas as ${jsonData.length} linhas contêm erros. Relatório de erros gerado.`,
          variant: 'destructive',
        });
        return {
          totalRows: jsonData.length,
          validRows: 0,
          invalidRows: jsonData.length,
          importedRows: 0,
          duplicatesSkipped: 0,
          processesCreated: 0,
          financialRecordsCreated: 0,
          responsaveisCreated: 0,
          errors: allErrors
        };
      }

      // Get current user
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      setProgress(50);

      // Check for duplicates
      const existingClientes = await supabase
        .from('clientes')
        .select('email, cpf_cnpj')
        .eq('user_id', user.user.id);

      const existingEmails = new Set(existingClientes.data?.map(c => c.email).filter(Boolean));
      const existingCpfCnpj = new Set(existingClientes.data?.map(c => c.cpf_cnpj).filter(Boolean));

      const clientesToInsert = validRows.filter(row => {
        const { email, cpf_cnpj } = row.data;
        if (email && existingEmails.has(email)) return false;
        if (cpf_cnpj && existingCpfCnpj.has(cpf_cnpj)) return false;
        return true;
      });

      const duplicatesSkipped = validRows.length - clientesToInsert.length;
      
      setProgress(70);

      // Insert valid clients and create processes
      let importedCount = 0;
      let processesCreated = 0;
      const clienteProcessMap = new Map<string, string>(); // Maps client ID to process data
      
      if (clientesToInsert.length > 0) {
        // Remove process fields from client data for insertion
        const clientesComUserId = clientesToInsert.map(row => {
          const { numero_processo, tipo_processo, ...clienteData } = row.data;
          return {
            ...clienteData,
            user_id: user.user.id
          };
        });

        // Insert clients in batches of 100
        const batchSize = 100;
        for (let i = 0; i < clientesComUserId.length; i += batchSize) {
          const batch = clientesComUserId.slice(i, i + batchSize);
          const { data: insertedClientes, error } = await supabase
            .from('clientes')
            .insert(batch)
            .select('id, nome');

          if (error) {
            console.error('Error inserting batch:', error);
            // Continue with next batch instead of failing completely
          } else {
            importedCount += batch.length;
            
            // Map client names to IDs for process creation
            if (insertedClientes) {
              insertedClientes.forEach((cliente, batchIndex) => {
                const originalRowIndex = i + batchIndex;
                const originalRow = clientesToInsert[originalRowIndex];
                if (originalRow?.data.numero_processo && originalRow?.data.tipo_processo) {
                  clienteProcessMap.set(cliente.id, JSON.stringify({
                    numero_processo: originalRow.data.numero_processo,
                    tipo_processo: originalRow.data.tipo_processo,
                    cliente_nome: cliente.nome
                  }));
                }
              });
            }
          }
          
          setProgress(70 + (i / clientesComUserId.length) * 15);
        }

        // Create processes for clients that have process data
        if (clienteProcessMap.size > 0) {
          setProgress(85);
          const processesToInsert = Array.from(clienteProcessMap.entries()).map(([clienteId, processDataStr]) => {
            const processData = JSON.parse(processDataStr);
            return {
              user_id: user.user.id,
              cliente_id: clienteId,
              numero_processo: processData.numero_processo,
              tipo_processo: processData.tipo_processo,
              status: 'ATIVO'
            };
          });

          // Insert processes in batches
          for (let i = 0; i < processesToInsert.length; i += batchSize) {
            const batch = processesToInsert.slice(i, i + batchSize);
            const { error } = await supabase
              .from('processos')
              .insert(batch);

            if (error) {
              console.error('Error inserting process batch:', error);
            } else {
              processesCreated += batch.length;
            }
          }
        }
      }

      setProgress(95);

      // Generate error report if there are errors
      const allErrors = processedRows.flatMap(row => row.errors);
      if (allErrors.length > 0) {
        await generateErrorReport(allErrors, file.name);
      }

      setProgress(100);

      const result: ImportResult = {
        totalRows: jsonData.length,
        validRows: validRows.length,
        invalidRows: invalidRows.length,
        importedRows: importedCount,
        duplicatesSkipped,
        processesCreated,
        financialRecordsCreated: 0, // TODO: Implementar criação de registros financeiros
        responsaveisCreated: 0, // TODO: Implementar criação de responsáveis
        errors: allErrors
      };

      // Show result toast
      if (importedCount > 0) {
        toast({
          title: 'Importação concluída',
          description: `${importedCount} cliente(s) importado(s) com sucesso${duplicatesSkipped > 0 ? `. ${duplicatesSkipped} duplicata(s) ignorada(s)` : ''}${allErrors.length > 0 ? `. ${allErrors.length} erro(s) encontrado(s)` : ''}`,
        });
      } else {
        toast({
          title: 'Nenhum cliente importado',
          description: 'Todos os registros eram duplicatas ou continham erros',
          variant: 'destructive',
        });
      }

      return result;

    } catch (error: any) {
      console.error('Error uploading Excel:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Falha ao processar arquivo Excel',
        variant: 'destructive',
      });
      return null;
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const generateErrorReport = async (errors: ValidationError[], originalFileName: string) => {
    if (errors.length === 0) return;

    const errorData = errors.map(error => ({
      'Linha': error.line,
      'Campo': error.field,
      'Valor': error.value || '',
      'Erro': error.message
    }));

    const worksheet = XLSX.utils.json_to_sheet(errorData);
    const workbook = XLSX.utils.book_new();
    
    const columnWidths = [
      { wch: 8 },  // Linha
      { wch: 15 }, // Campo
      { wch: 25 }, // Valor
      { wch: 40 }, // Erro
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Erros');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    const fileName = `erros_${originalFileName.replace('.xlsx', '')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
  };

  const downloadTemplateExcel = () => {
    // Criar template completo com todos os campos
    const templateData = [
      {
        // Dados do Cliente
        'Nome': 'João Silva Santos',
        'Email': 'joao@exemplo.com',
        'Telefone': '(11) 99999-9999',
        'CPF/CNPJ': '123.456.789-00',
        'RG': '12.345.678-9',
        'Data Nascimento': '1985-05-15',
        'Endereço': 'Rua das Flores, 123',
        'Bairro': 'Centro',
        'Cidade': 'São Paulo',
        'CEP': '01234-567',
        
        // Dados do Processo
        'Número do Processo': '0001234-56.2024.8.26.0100',
        'Tipo de Processo': 'Criminal',
        'Prazo': '2024-12-31',
        'Descrição': 'Processo de defesa criminal',
        'Cliente Preso': 'Não',
        
        // Dados Financeiros
        'Valor Honorários': '15000',
        'Valor Entrada': '3000',
        'Data Entrada': '2024-01-15',
        'Quantidade Parcelas': '12',
        'Data Primeiro Vencimento': '2024-02-15',
        'Incluir TMP': 'Sim',
        'Valor TMP': '500',
        'Vencimento TMP': '2024-01-31',
        'Quantidade Meses TMP': '24',
        
        // Responsável Financeiro
        'Responsável Nome': 'Maria Silva Santos',
        'Responsável RG': '98.765.432-1',
        'Responsável CPF': '987.654.321-00',
        'Responsável Data Nascimento': '1980-03-20',
        'Responsável Telefone': '(11) 88888-8888',
        'Responsável Email': 'maria@exemplo.com',
        'Responsável Endereço': 'Rua das Palmeiras, 456 - Jardim Europa',
        'Responsável CEP': '98765-432'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    
    // Ajustar larguras das colunas
    const columnWidths = [
      { wch: 25 }, // Nome
      { wch: 25 }, // Email
      { wch: 15 }, // Telefone
      { wch: 15 }, // CPF/CNPJ
      { wch: 15 }, // RG
      { wch: 12 }, // Data Nascimento
      { wch: 30 }, // Endereço
      { wch: 15 }, // Bairro
      { wch: 15 }, // Cidade
      { wch: 10 }, // CEP
      { wch: 25 }, // Número do Processo
      { wch: 15 }, // Tipo de Processo
      { wch: 12 }, // Prazo
      { wch: 30 }, // Descrição
      { wch: 12 }, // Cliente Preso
      { wch: 15 }, // Valor Honorários
      { wch: 15 }, // Valor Entrada
      { wch: 12 }, // Data Entrada
      { wch: 15 }, // Quantidade Parcelas
      { wch: 18 }, // Data Primeiro Vencimento
      { wch: 12 }, // Incluir TMP
      { wch: 12 }, // Valor TMP
      { wch: 15 }, // Vencimento TMP
      { wch: 18 }, // Quantidade Meses TMP
      { wch: 25 }, // Responsável Nome
      { wch: 15 }, // Responsável RG
      { wch: 15 }, // Responsável CPF
      { wch: 18 }, // Responsável Data Nascimento
      { wch: 15 }, // Responsável Telefone
      { wch: 25 }, // Responsável Email
      { wch: 40 }, // Responsável Endereço
      { wch: 12 }, // Responsável CEP
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Completo');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    saveAs(blob, 'template_processo_completo.xlsx');

    toast({
      title: 'Template baixado',
      description: 'Arquivo template_processo_completo.xlsx baixado com sucesso',
    });
  };

  return {
    loading,
    importing,
    progress,
    downloadClientesExcel,
    uploadClientesExcel,
    downloadTemplateExcel,
    generateErrorReport
  };
};