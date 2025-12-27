import { X, Filter, AlertCircle, Clock, Calendar } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { FiltroCliente } from './FiltroCliente';
import { FiltroProcesso } from './FiltroProcesso';
import { FiltrosPrazos, TipoUrgencia, StatusPrazo } from '@/types/filtros';

interface BuscaAvancadaProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filtros: FiltrosPrazos;
    onUpdateFiltro: <K extends keyof FiltrosPrazos>(chave: K, valor: FiltrosPrazos[K]) => void;
    onToggleUrgencia: (urgencia: TipoUrgencia) => void;
    onLimpar: () => void;
    totalResultados?: number;
}

export function BuscaAvancada({
    open,
    onOpenChange,
    filtros,
    onUpdateFiltro,
    onToggleUrgencia,
    onLimpar,
    totalResultados
}: BuscaAvancadaProps) {

    const urgencias: Array<{ value: TipoUrgencia; label: string; icon: any; color: string }> = [
        { value: 'urgente', label: 'Urgente (≤3 dias)', icon: AlertCircle, color: 'text-red-600' },
        { value: 'atencao', label: 'Atenção (4-7 dias)', icon: AlertCircle, color: 'text-orange-600' },
        { value: 'medio', label: 'Médio (8-15 dias)', icon: Clock, color: 'text-blue-600' },
        { value: 'longo', label: 'Longo (>15 dias)', icon: Calendar, color: 'text-green-600' }
    ];

    const statusOptions: Array<{ value: StatusPrazo; label: string }> = [
        { value: 'ativos', label: 'Apenas ativos' },
        { value: 'vencidos', label: 'Apenas vencidos' },
        { value: 'cumpridos', label: 'Apenas cumpridos' },
        { value: 'todos', label: 'Todos os prazos' }
    ];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Busca Avançada
                    </SheetTitle>
                    <SheetDescription>
                        Combine múltiplos filtros para encontrar os prazos que você precisa
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Cliente */}
                    <FiltroCliente
                        value={filtros.cliente_id}
                        clienteNome={filtros.cliente_nome}
                        onSelect={(id, nome) => {
                            onUpdateFiltro('cliente_id', id);
                            onUpdateFiltro('cliente_nome', nome);
                        }}
                    />

                    <Separator />

                    {/* Número do Processo */}
                    <FiltroProcesso
                        value={filtros.processo_id}
                        numeroProcesso={filtros.numero_processo}
                        onSelect={(id, numero) => {
                            onUpdateFiltro('processo_id', id);
                            onUpdateFiltro('numero_processo', numero);
                        }}
                    />

                    <Separator />

                    {/* Filtro de Urgência */}
                    <div className="space-y-3">
                        <Label>⚡ Urgência</Label>
                        <div className="space-y-2">
                            {urgencias.map(({ value, label, icon: Icon, color }) => {
                                const isChecked = filtros.urgencias?.includes(value) || false;
                                return (
                                    <div key={value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`urgencia-${value}`}
                                            checked={isChecked}
                                            onCheckedChange={() => onToggleUrgencia(value)}
                                        />
                                        <label
                                            htmlFor={`urgencia-${value}`}
                                            className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            <Icon className={`h-4 w-4 ${color}`} />
                                            {label}
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <Separator />

                    {/* Filtro de Data Final */}
                    <div className="space-y-3">
                        <Label>📅 Data Final (Vencimento)</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="data-de" className="text-xs">De</Label>
                                <Input
                                    id="data-de"
                                    type="date"
                                    value={filtros.data_final_de || ''}
                                    onChange={(e) => onUpdateFiltro('data_final_de', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="data-ate" className="text-xs">Até</Label>
                                <Input
                                    id="data-ate"
                                    type="date"
                                    value={filtros.data_final_ate || ''}
                                    onChange={(e) => onUpdateFiltro('data_final_ate', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Filtro de Status */}
                    <div className="space-y-3">
                        <Label>📊 Status</Label>
                        <RadioGroup
                            value={filtros.status || 'ativos'}
                            onValueChange={(value) => onUpdateFiltro('status', value as StatusPrazo)}
                        >
                            {statusOptions.map(({ value, label }) => (
                                <div key={value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={value} id={`status-${value}`} />
                                    <Label htmlFor={`status-${value}`} className="cursor-pointer font-normal">
                                        {label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                </div>

                {/* Footer com ações */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                onLimpar();
                                onOpenChange(false);
                            }}
                            className="flex-1"
                        >
                            Limpar Tudo
                        </Button>
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Aplicar
                            {totalResultados !== undefined && (
                                <span className="ml-2 bg-background/20 px-2 py-0.5 rounded-full text-xs">
                                    {totalResultados}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
