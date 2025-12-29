import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CheckCircle2, XCircle, Mail, HardDrive, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GoogleStatus {
    connected: boolean;
    email?: string;
    connectedAt?: string;
    scopes?: string[];
}

export function GoogleStatusIndicator() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<GoogleStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Ícone do Google (SVG Inline para controle de cor)
    const GoogleIcon = ({ grayscale = false }: { grayscale?: boolean }) => (
        <svg
            viewBox="0 0 24 24"
            className={`w-5 h-5 transition-all ${grayscale ? "grayscale opacity-70" : ""}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    );

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/google/system/status");
            if (response.ok) {
                const data = await response.json();
                setStatus(data);
            }
        } catch (error) {
            console.error("Erro ao verificar status do Google:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // Atualizar periodicamente? Talvez não seja necessário por agora.
    }, []);

    const hasService = (service: string) => {
        if (!status?.scopes) return false;
        return status.scopes.some((scope) => scope.includes(service));
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (isOpen) fetchStatus();
        }}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`gap-2 ${status?.connected
                            ? "border-green-200 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800"
                            : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700"
                        }`}
                >
                    <GoogleIcon grayscale={!status?.connected} />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GoogleIcon />
                        Integração Google
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-6">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : status?.connected ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-green-900 dark:text-green-300">Conectado com sucesso</h3>
                                <p className="text-sm text-green-700 dark:text-green-400">{status.email}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground">Serviços Ativos</h4>
                            <div className="grid grid-cols-1 gap-2">
                                <div className={`flex items-center justify-between p-3 rounded-md border ${hasService("gmail") ? "bg-card border-border" : "bg-muted/50 border-transparent opacity-50"}`}>
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-red-500" />
                                        <span>Gmail</span>
                                    </div>
                                    {hasService("gmail") && <Badge variant="secondary" className="text-xs">Ativo</Badge>}
                                </div>

                                <div className={`flex items-center justify-between p-3 rounded-md border ${hasService("drive") ? "bg-card border-border" : "bg-muted/50 border-transparent opacity-50"}`}>
                                    <div className="flex items-center gap-3">
                                        <HardDrive className="w-4 h-4 text-blue-500" />
                                        <span>Google Drive</span>
                                    </div>
                                    {hasService("drive") && <Badge variant="secondary" className="text-xs">Ativo</Badge>}
                                </div>

                                <div className={`flex items-center justify-between p-3 rounded-md border ${hasService("calendar") ? "bg-card border-border" : "bg-muted/50 border-transparent opacity-50"}`}>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-green-500" />
                                        <span>Calendar</span>
                                    </div>
                                    {hasService("calendar") && <Badge variant="secondary" className="text-xs">Ativo</Badge>}
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground text-center">
                            Conectado em {status.connectedAt ? format(new Date(status.connectedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "-"}
                        </div>

                        <Button
                            variant="outline"
                            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                                setOpen(false);
                                navigate("/google-integration");
                            }}
                        >
                            Gerenciar Conexão
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 text-center py-4">
                        <div className="flex justify-center">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                                <XCircle className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium text-lg">Não Conectado</h3>
                            <p className="text-muted-foreground mt-1">Conecte sua conta Google para sincronizar e-mails, arquivos e agenda.</p>
                        </div>

                        <Button
                            className="w-full gap-2"
                            onClick={() => {
                                setOpen(false);
                                navigate("/google-integration");
                            }}
                        >
                            <ExternalLink className="w-4 h-4" />
                            Conectar Agora
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
