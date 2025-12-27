import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Processo {
    id: string;
    numero_processo: string;
}

interface FiltroProcessoProps {
    value?: string;
    numeroProcesso?: string;
    onSelect: (processoId: string, numeroProcesso: string) => void;
}

export function FiltroProcesso({ value, numeroProcesso, onSelect }: FiltroProcessoProps) {
    const [searchTerm, setSearchTerm] = useState(numeroProcesso || '');
    const [processos, setProcessos] = useState<Processo[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout>();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Busca processos via API
    const searchProcessos = async (term: string) => {
        if (!term || term.length < 3) {
            setProcessos([]);
            return;
        }

        setLoading(true);
        try {
            console.log('[FiltroProcesso] Buscando:', term);

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`/api/processos?search=${encodeURIComponent(term)}&limit=20`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error('[FiltroProcesso] Erro:', response.status);
                throw new Error('Erro ao buscar processos');
            }

            const data = await response.json();
            console.log('[FiltroProcesso] Encontrados:', data);
            setProcessos(data || []);
            setShowResults(true);
        } catch (err) {
            console.error('[FiltroProcesso] Erro:', err);
            setProcessos([]);
        } finally {
            setLoading(false);
        }
    };

    // Debounce da busca
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            searchProcessos(searchTerm);
        }, 300);

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [searchTerm]);

    // Fecha dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (processo: Processo) => {
        setSearchTerm(processo.numero_processo);
        onSelect(processo.id, processo.numero_processo);
        setShowResults(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (!showResults) setShowResults(true);
    };

    return (
        <div className="space-y-2" ref={wrapperRef}>
            <Label htmlFor="processo-search" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Número do Processo
            </Label>
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="processo-search"
                        type="text"
                        placeholder="Digite para buscar..."
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={() => {
                            if (processos.length > 0) setShowResults(true);
                        }}
                        className="pl-10 pr-10"
                    />
                    {loading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>

                {/* Dropdown de resultados */}
                {showResults && processos.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-auto">
                        {processos.map((processo) => (
                            <button
                                key={processo.id}
                                type="button"
                                onClick={() => handleSelect(processo)}
                                className={cn(
                                    "w-full px-3 py-2 text-left hover:bg-accent transition-colors",
                                    value === processo.id && "bg-accent"
                                )}
                            >
                                <span className="font-medium text-sm">{processo.numero_processo}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Mensagem quando não há resultados */}
                {showResults && !loading && searchTerm.length >= 3 && processos.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md p-3 text-sm text-muted-foreground">
                        Nenhum processo encontrado
                    </div>
                )}
            </div>
        </div>
    );
}
