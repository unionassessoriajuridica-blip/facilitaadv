import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Cliente {
    id: string;
    nome: string;
    cpf_cnpj: string | null;
}

interface FiltroClienteProps {
    value?: string;
    clienteNome?: string;
    onSelect: (clienteId: string, clienteNome: string) => void;
}

export function FiltroCliente({ value, clienteNome, onSelect }: FiltroClienteProps) {
    const [searchTerm, setSearchTerm] = useState(clienteNome || '');
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout>();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Busca clientes via API (ignora RLS)
    const searchClientes = async (term: string) => {
        if (!term || term.length < 2) {
            setClientes([]);
            return;
        }

        setLoading(true);
        try {
            console.log('[FiltroCliente] Buscando:', term);

            // Pega token da sessão
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            console.log('[FiltroCliente] Token:', token ? 'presente' : 'ausente');

            const response = await fetch(
                `/api/clientes?search=${encodeURIComponent(term)}&limit=20`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            console.log('[FiltroCliente] Status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[FiltroCliente] Erro:', errorText);
                throw new Error('Erro ao buscar clientes');
            }

            const data = await response.json();
            console.log('[FiltroCliente] Encontrados:', data);
            setClientes(data || []);
            setShowResults(true);
        } catch (err) {
            console.error('[FiltroCliente] Erro:', err);
            setClientes([]);
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
            searchClientes(searchTerm);
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

    const handleSelect = (cliente: Cliente) => {
        setSearchTerm(cliente.nome);
        onSelect(cliente.id, cliente.nome);
        setShowResults(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (!showResults) setShowResults(true);
    };

    return (
        <div className="space-y-2" ref={wrapperRef}>
            <Label htmlFor="cliente-search" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
            </Label>
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="cliente-search"
                        type="text"
                        placeholder="Digite para buscar..."
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={() => {
                            if (clientes.length > 0) setShowResults(true);
                        }}
                        className="pl-10 pr-10"
                    />
                    {loading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>

                {/* Dropdown de resultados */}
                {showResults && clientes.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-auto">
                        {clientes.map((cliente) => (
                            <button
                                key={cliente.id}
                                type="button"
                                onClick={() => handleSelect(cliente)}
                                className={cn(
                                    "w-full px-3 py-2 text-left hover:bg-accent transition-colors",
                                    value === cliente.id && "bg-accent"
                                )}
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{cliente.nome}</span>
                                    {cliente.cpf_cnpj && (
                                        <span className="text-xs text-muted-foreground">
                                            {cliente.cpf_cnpj}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Mensagem quando não há resultados */}
                {showResults && !loading && searchTerm.length >= 2 && clientes.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md p-3 text-sm text-muted-foreground">
                        Nenhum cliente encontrado
                    </div>
                )}
            </div>
        </div>
    );
}
