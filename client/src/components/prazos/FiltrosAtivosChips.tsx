import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FiltroAtivo } from '@/types/filtros';

interface FiltrosAtivosChipsProps {
    filtros: FiltroAtivo[];
    onRemove: (chave: string) => void;
    onLimparTodos: () => void;
}

export function FiltrosAtivosChips({ filtros, onRemove, onLimparTodos }: FiltrosAtivosChipsProps) {
    if (filtros.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/50 rounded-lg mb-4">
            <span className="text-sm font-medium text-muted-foreground">Filtros ativos:</span>

            {filtros.map((filtro) => (
                <Badge
                    key={filtro.chave}
                    variant="secondary"
                    className="gap-1 pr-1 hover:bg-secondary/80 transition-colors"
                >
                    <span className="text-xs">
                        <strong>{filtro.label}:</strong> {filtro.valor}
                    </span>
                    <button
                        onClick={() => onRemove(filtro.chave)}
                        className="ml-1 hover:bg-background/50 rounded-full p-0.5 transition-colors"
                        aria-label={`Remover filtro ${filtro.label}`}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}

            <Button
                variant="ghost"
                size="sm"
                onClick={onLimparTodos}
                className="h-6 text-xs"
            >
                Limpar todos
            </Button>
        </div>
    );
}
