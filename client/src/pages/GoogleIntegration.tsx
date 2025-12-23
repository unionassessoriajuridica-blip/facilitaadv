import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Settings, 
  Shield, 
  Calendar as CalendarIcon, 
  HardDrive, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  Users,
  Link,
  Unlink
} from 'lucide-react';
import Swal from 'sweetalert2';

interface SystemStatus {
  connected: boolean;
  email?: string;
  connectedAt?: string;
  scopes?: string[];
  error?: string;
}

const GoogleIntegration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const googleConnected = searchParams.get('google_connected');
  const googleError = searchParams.get('google_error');
  
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    checkSystemStatus();
    
    if (googleConnected === 'true') {
      Swal.fire({
        title: 'Google conectado!',
        text: 'Agora todos os usuários do sistema podem usar Gmail, Calendar e Drive.',
        icon: 'success'
      });
      window.history.replaceState({}, '', '/google-integration');
    } else if (googleError) {
      Swal.fire({
        title: 'Erro na conexão',
        text: decodeURIComponent(googleError),
        icon: 'error'
      });
      window.history.replaceState({}, '', '/google-integration');
    }
  }, [googleConnected, googleError]);

  const checkSystemStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/google/system/status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Error checking system status:', error);
      setSystemStatus({ connected: false, error: 'Failed to check status' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/google/system/auth-url');
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get auth URL');
      }
    } catch (error: any) {
      console.error('Error connecting:', error);
      Swal.fire({
        title: 'Erro',
        text: error.message || 'Não foi possível iniciar a conexão',
        icon: 'error'
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const result = await Swal.fire({
      title: 'Desconectar Google?',
      text: 'Isso irá desconectar a integração Google para TODOS os usuários do sistema. Você tem certeza?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, desconectar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/google/system/disconnect', {
        method: 'POST'
      });
      
      if (response.ok) {
        Swal.fire({
          title: 'Desconectado!',
          text: 'A integração Google foi desconectada.',
          icon: 'success'
        });
        checkSystemStatus();
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      Swal.fire({
        title: 'Erro',
        text: 'Não foi possível desconectar',
        icon: 'error'
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/dashboard')} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Integração Google (Sistema)</h1>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Integração para Todo o Sistema
                    </CardTitle>
                    <CardDescription>
                      Uma única conexão Google para todos os usuários
                    </CardDescription>
                  </div>
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : systemStatus?.connected ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Conectado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="w-3 h-3 mr-1" />
                      Não conectado
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : systemStatus?.connected ? (
                  <>
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-200">
                          Conectado como
                        </span>
                      </div>
                      <p className="text-green-700 dark:text-green-300 font-mono">
                        {systemStatus.email}
                      </p>
                      {systemStatus.connectedAt && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Conectado em: {new Date(systemStatus.connectedAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={checkSystemStatus}
                        className="flex-1"
                        data-testid="button-refresh-status"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar Status
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        className="flex-1"
                        data-testid="button-disconnect"
                      >
                        {isDisconnecting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Unlink className="w-4 h-4 mr-2" />
                        )}
                        Desconectar
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      Conecte uma conta Google para habilitar Gmail, Calendar e Drive para todos os usuários do sistema.
                    </p>
                    <Button 
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="w-full"
                      data-testid="button-connect-google"
                    >
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Link className="w-4 h-4 mr-2" />
                      )}
                      Conectar conta Google
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Servicos Disponiveis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">Gmail</span>
                  </div>
                  {systemStatus?.connected ? (
                    <Badge className="bg-green-600">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">Calendar</span>
                  </div>
                  {systemStatus?.connected ? (
                    <Badge className="bg-green-600">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <HardDrive className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">Drive</span>
                  </div>
                  {systemStatus?.connected ? (
                    <Badge className="bg-green-600">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Como funciona</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Administrador conecta</h4>
                    <p className="text-sm text-muted-foreground">
                      Um administrador conecta a conta Google do escritorio
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Todos os usuarios tem acesso</h4>
                    <p className="text-sm text-muted-foreground">
                      Qualquer usuario logado pode usar Gmail, Calendar e Drive
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Tokens renovados automaticamente</h4>
                    <p className="text-sm text-muted-foreground">
                      O sistema renova os tokens automaticamente, sem necessidade de reconexao
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Seguranca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    Tokens armazenados de forma segura no servidor
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    Autenticacao OAuth 2.0 padrao Google
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    Permissoes minimas necessarias solicitadas
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    Tokens nunca expostos ao frontend
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleIntegration;
