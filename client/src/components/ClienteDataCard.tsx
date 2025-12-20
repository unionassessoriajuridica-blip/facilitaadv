import * as React from "react";
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.tsx';
import { Download, Upload, FileSpreadsheet, Info } from 'lucide-react';
import { useClienteExcel } from '@/hooks/useClienteExcel.ts';

export const ClienteDataCard = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { loading, downloadClientesExcel, uploadClientesExcel, downloadTemplateExcel } = useClienteExcel();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const success = await uploadClientesExcel(selectedFile);
    if (success) {
      setShowDialog(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="w-full max-w-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          <CardTitle className="text-lg">Dados Cadastrais</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Gerenciar dados de clientes via Excel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadClientesExcel}
            disabled={loading}
            className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Gerando...' : 'Baixar Excel'}
          </Button>

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                <Upload className="w-4 h-4" />
                Importar Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Importar Clientes</DialogTitle>
                <DialogDescription>
                  Selecione um arquivo Excel com dados de clientes para importar.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Formato esperado:</p>
                      <ul className="text-xs space-y-0.5">
                        <li>• Nome (obrigatório)</li>
                        <li>• Email</li>
                        <li>• Telefone</li>
                        <li>• CPF/CNPJ</li>
                        <li>• Endereço</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplateExcel}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template
                </Button>

                <div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="mb-2"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Arquivo: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || loading}
                    className="flex-1"
                  >
                    {loading ? 'Importando...' : 'Importar'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};