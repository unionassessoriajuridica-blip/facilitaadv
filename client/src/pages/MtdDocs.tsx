import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Info, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MtdDocs() {
    return (
        <div className="container mx-auto py-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Modelo de Transferência de Dados (MTD)</h1>
                <p className="text-muted-foreground">
                    Referência dos campos disponíveis na API Pública do DataJud/CNJ
                </p>
            </div>

            <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                    O MTD é o modelo de dados padronizado pelo CNJ para troca de informações processuais.
                    Esta página documenta quais campos estão disponíveis na API Pública do DataJud.
                </AlertDescription>
            </Alert>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        O que é o MTD?
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>
                        O <strong>Modelo de Transferência de Dados (MTD)</strong> é um schema XML definido pelo CNJ
                        que padroniza a estrutura de dados processuais em todo o sistema judiciário brasileiro.
                    </p>
                    <p>
                        O MTD define <strong>todos os campos possíveis</strong> que um processo pode ter, incluindo:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Dados básicos (número, classe, assunto, datas)</li>
                        <li>Partes (autor, réu, advogados)</li>
                        <li>Movimentos processuais</li>
                        <li>Documentos e petições</li>
                        <li>Audiências e despachos</li>
                        <li>Decisões e sentenças</li>
                    </ul>
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Campos Disponíveis na API Pública</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Nem todos os campos do MTD estão disponíveis na API Pública. A tabela abaixo mostra o mapeamento:
                    </p>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell className="w-1/4 font-bold">Campo MTD</TableCell>
                                <TableCell className="w-1/4 font-bold">Campo API</TableCell>
                                <TableCell className="w-1/6 font-bold text-center">Disponível?</TableCell>
                                <TableCell className="w-1/3 font-bold">Observações</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-mono text-xs">numeroProcesso</TableCell>
                                <TableCell className="font-mono text-xs">numeroProcesso</TableCell>
                                <TableCell className="text-center">✅</TableCell>
                                <TableCell className="text-xs">Número CNJ completo</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-xs">classe.codigo</TableCell>
                                <TableCell className="font-mono text-xs">classe.codigo</TableCell>
                                <TableCell className="text-center">✅</TableCell>
                                <TableCell className="text-xs">Código TPU da classe</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-xs">classe.nome</TableCell>
                                <TableCell className="font-mono text-xs">classe.nome</TableCell>
                                <TableCell className="text-center">✅</TableCell>
                                <TableCell className="text-xs">Ex: "Ação de Cobrança"</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-xs">assunto.codigo</TableCell>
                                <TableCell className="font-mono text-xs">assunto.codigo</TableCell>
                                <TableCell className="text-center">✅</TableCell>
                                <TableCell className="text-xs">Código TPU do assunto</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-xs">dataAjuizamento</TableCell>
                                <TableCell className="font-mono text-xs">dataAjuizamento</TableCell>
                                <TableCell className="text-center">✅</TableCell>
                                <TableCell className="text-xs">ISO 8601 format</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-xs">movimento.codigo</TableCell>
                                <TableCell className="font-mono text-xs">movimentos[].codigo</TableCell>
                                <TableCell className="text-center">✅</TableCell>
                                <TableCell className="text-xs">Código TPU do movimento</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-xs">movimento.dataHora</TableCell>
                                <TableCell className="font-mono text-xs">movimentos[].dataHora</TableCell>
                                <TableCell className="text-center">✅</TableCell>
                                <TableCell className="text-xs">Data/hora do movimento</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-xs">movimento.descricao</TableCell>
                                <TableCell className="font-mono text-xs">movimentos[].descricao</TableCell>
                                <TableCell className="text-center">✅</TableCell>
                                <TableCell className="text-xs">Descrição resumida</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-xs">tribunal</TableCell>
                                <TableCell className="font-mono text-xs">tribunal</TableCell>
                                <TableCell className="text-center">✅</TableCell>
                                <TableCell className="text-xs">Nome do tribunal</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-xs">orgaoJulgador</TableCell>
                                <TableCell className="font-mono text-xs">orgaoJulgador</TableCell>
                                <TableCell className="text-center">✅</TableCell>
                                <TableCell className="text-xs">Vara/Câmara</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-xs">nivelSigilo</TableCell>
                                <TableCell className="font-mono text-xs">nivelSigilo</TableCell>
                                <TableCell className="text-center">✅</TableCell>
                                <TableCell className="text-xs">0=público, 1-5=sigiloso</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-xs">partes.pessoa.cpf</TableCell>
                                <TableCell className="font-mono text-xs">-</TableCell>
                                <TableCell className="text-center">⚠️</TableCell>
                                <TableCell className="text-xs">Oculto se processo sigiloso</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-xs">documento.conteudo</TableCell>
                                <TableCell className="font-mono text-xs">-</TableCell>
                                <TableCell className="text-center">❌</TableCell>
                                <TableCell className="text-xs">Inteiro teor não disponível</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-mono text-xs">documento.arquivo</TableCell>
                                <TableCell className="font-mono text-xs">-</TableCell>
                                <TableCell className="text-center">❌</TableCell>
                                <TableCell className="text-xs">PDFs não disponíveis</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Exemplo de Resposta da API</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                        {`{
  "hits": {
    "hits": [
      {
        "_source": {
          "numeroProcesso": "0002660-60.2025.8.26.0496",
          "tribunal": "TJSP",
          "classe": {
            "codigo": 1116,
            "nome": "Ação de Cobrança"
          },
          "assunto": {
            "codigo": 3127,
            "nome": "Inadimplemento"
          },
          "dataAjuizamento": "2025-01-15",
          "grau": "1",
          "movimentos": [
            {
              "codigo": 246,
              "descricao": "Intimação",
              "dataHora": "2025-12-20T10:30:00Z",
              "complemento": "Para resposta"
            }
          ]
        }
      }
    ]
  }
}`}
                    </pre>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ExternalLink className="w-5 h-5" />
                        Links Úteis
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <a
                                href="https://datajud-wiki.cnj.jus.br/mtd/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                📄 MTD Completo (CNJ Wiki)
                            </a>
                        </Button>
                    </div>

                    <div>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <a
                                href="https://datajud-wiki.cnj.jus.br/api-publica/glossario/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                📖 Glossário da API Pública
                            </a>
                        </Button>
                    </div>

                    <div>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <a
                                href="https://datajud-wiki.cnj.jus.br/api-publica/exemplos/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                💡 Exemplos de Uso
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
