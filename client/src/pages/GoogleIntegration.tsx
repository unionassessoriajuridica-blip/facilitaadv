import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Shield, Check, Calendar as CalendarIcon } from 'lucide-react';
import { GoogleIntegrationCard } from '@/components/GoogleIntegrationCard';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import Swal from 'sweetalert2';

const GoogleIntegration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  // Configuração real do Google OAuth
  const googleAuth = useGoogleAuth({
    clientId: '90141190775-qqgb05aq59fmqegieiguk4gq0u0140sp.apps.googleusercontent.com',

    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar'
    ]
  });
  
   useEffect(() => {
    if (success) {
      Swal.fire({
        title: 'Conexão estabelecida!',
        text: 'Agora você pode usar todos os recursos integrados com o Google.',
        icon: 'success'
      });
    } else if (error) {
      Swal.fire({
        title: 'Erro na conexão',
        text: 'Não foi possível completar a integração com o Google.',
        icon: 'error'
      });
    }
  }, [success, error]);

  const handleConnect = (permissions: string[]) => {
    console.log('Permissões concedidas:', permissions);
  };

  const handleDisconnect = () => {
    console.log('Conta desconectada');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Integração Google</h1>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Card de Integração */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Conectar sua conta Google</h2>
              <p className="text-muted-foreground">
                Integre seu Gmail e Google Calendar para uma experiência completa no sistema jurídico.
              </p>
            </div>

            <GoogleIntegrationCard
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isConnected={googleAuth.isAuthenticated}
              userInfo={googleAuth.userInfo || undefined}
            />
          </div>

          {/* Informações sobre a integração */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Benefícios da integração</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Envio de emails automático</h4>
                    <p className="text-sm text-muted-foreground">
                      Envie notificações e documentos diretamente do sistema para seus clientes
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Sincronização de agenda</h4>
                    <p className="text-sm text-muted-foreground">
                      Mantenha seus compromissos sincronizados entre o sistema e o Google Calendar
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Segurança garantida</h4>
                    <p className="text-sm text-muted-foreground">
                      Todas as integrações seguem os padrões de segurança OAuth 2.0 do Google
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Privacidade e Segurança</h4>
              <p className="text-sm text-muted-foreground">
                Suas informações são protegidas e utilizadas apenas para as funcionalidades 
                solicitadas. Você pode revogar as permissões a qualquer momento nas 
                configurações da sua conta Google.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleIntegration;