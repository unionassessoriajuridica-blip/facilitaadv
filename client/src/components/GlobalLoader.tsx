import { useGlobalLoading } from '@/contexts/LoadingContext';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function GlobalLoader() {
    const { isLoading, loadingMessage } = useGlobalLoading();

    if (!isLoading) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
            <Card className="p-4 shadow-lg border-2 border-primary bg-background">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <div>
                        <p className="font-semibold">Processando...</p>
                        <p className="text-sm text-muted-foreground">{loadingMessage}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
