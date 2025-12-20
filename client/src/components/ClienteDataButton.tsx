import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Upload, FileSpreadsheet, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { useClienteExcel } from '@/hooks/useClienteExcel';

export const ClienteDataButton = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { loading, importing, progress, downloadClientesExcel, uploadClientesExcel, downloadTemplateExcel } = useClienteExcel();

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await uploadClientesExcel(selectedFile);
    if (result) {
      setImportResult(result);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setImportResult(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800"
          onClick={() => setShowDialog(true)}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Dados Cadastrais
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Importação Completa de Processos
          </DialogTitle>
          <DialogDescription>
            Importe clientes, processos, dados financeiros e responsáveis via Excel. Sistema completo de migração de dados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {importResult ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-900">Importação Concluída</h3>
                </div>
                <div className="space-y-2 text-sm text-green-800">
                  <p>📊 Total de linhas: {importResult.totalRows}</p>
                  <p>✅ Registros válidos: {importResult.validRows}</p>
                  <p>📥 Clientes importados: {importResult.importedRows}</p>
                  {importResult.processesCreated > 0 && (
                    <p>⚖️ Processos criados: {importResult.processesCreated}</p>
                  )}
                  {importResult.duplicatesSkipped > 0 && (
                    <p>⚠️ Duplicatas ignoradas: {importResult.duplicatesSkipped}</p>
                  )}
                  {importResult.invalidRows > 0 && (
                    <p>❌ Registros com erro: {importResult.invalidRows}</p>
                  )}
                  {importResult.errors.length > 0 && (
                    <p className="text-orange-700">📄 Relatório de erros foi gerado automaticamente</p>
                  )}
                </div>
              </div>
              <Button onClick={handleCloseDialog} className="w-full">
                Fechar
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={downloadClientesExcel}
                  disabled={loading || importing}
                  className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
                >
                  <Download className="w-4 h-4" />
                  {loading ? 'Gerando...' : 'Baixar Excel'}
                </Button>

                <Button
                  variant="outline"
                  onClick={downloadTemplateExcel}
                  disabled={importing}
                  className="flex items-center gap-2 text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                  <Download className="w-4 h-4" />
                  Template
                </Button>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Formato do Excel - Campos Disponíveis:</p>
                    <div className="space-y-2 text-xs">
                      <div className="border-b pb-1">
                        <p className="font-medium text-blue-700">📋 Dados do Cliente:</p>
                        <ul className="ml-2 space-y-0.5">
                          <li>• Nome (obrigatório)</li>
                          <li>• Email, Telefone, CPF/CNPJ, RG</li>
                          <li>• Data Nascimento, Endereço, Bairro, Cidade, CEP</li>
                        </ul>
                      </div>
                      
                      <div className="border-b pb-1">
                        <p className="font-medium text-green-700">⚖️ Dados do Processo:</p>
                        <ul className="ml-2 space-y-0.5">
                          <li>• Número do Processo, Tipo de Processo</li>
                          <li>• Prazo, Descrição, Cliente Preso (Sim/Não)</li>
                        </ul>
                      </div>
                      
                      <div className="border-b pb-1">
                        <p className="font-medium text-purple-700">💰 Dados Financeiros:</p>
                        <ul className="ml-2 space-y-0.5">
                          <li>• Valor Honorários, Valor Entrada, Data Entrada</li>
                          <li>• Quantidade Parcelas, Data Primeiro Vencimento</li>
                          <li>• Incluir TMP, Valor TMP, Vencimento TMP, Quantidade Meses TMP</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium text-orange-700">👤 Responsável Financeiro:</p>
                        <ul className="ml-2 space-y-0.5">
                          <li>• Responsável Nome, RG, CPF, Data Nascimento</li>
                          <li>• Responsável Telefone, Email, Endereço, CEP</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-1 text-xs text-blue-600">
                      <p>ℹ️ Apenas o Nome é obrigatório - outros campos são opcionais</p>
                      <p>📋 Processos e dados financeiros são criados automaticamente quando preenchidos</p>
                      <p>⚠️ Duplicatas de email/CPF serão ignoradas automaticamente</p>
                    </div>
                  </div>
                </div>
              </div>

              {importing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Processando arquivo...</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                  <p className="text-xs text-muted-foreground">{progress}% concluído</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Importar Excel:</label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    disabled={importing}
                    className="mt-1"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Arquivo: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || importing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {importing ? 'Importando...' : 'Importar Excel'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={importing}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};