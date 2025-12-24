import { AlertTriangle } from "lucide-react";

interface EnvErrorScreenProps {
  missingVars: string[];
}

export function EnvErrorScreen({ missingVars }: EnvErrorScreenProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg p-8 max-w-2xl w-full border border-red-500/50">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <h1 className="text-2xl font-bold text-white">Erro de Configuracao</h1>
        </div>
        
        <p className="text-gray-300 mb-4">
          O FacilitaAdv nao conseguiu iniciar porque algumas variaveis de ambiente obrigatorias nao estao configuradas.
        </p>
        
        <div className="bg-slate-900 rounded p-4 mb-6">
          <h2 className="text-amber-400 font-semibold mb-2">Variaveis faltando:</h2>
          <ul className="list-disc list-inside text-red-400">
            {missingVars.map((v) => (
              <li key={v} className="font-mono">{v}</li>
            ))}
          </ul>
        </div>
        
        <div className="bg-slate-900 rounded p-4 mb-6">
          <h2 className="text-amber-400 font-semibold mb-2">Como corrigir:</h2>
          <ol className="list-decimal list-inside text-gray-300 space-y-2">
            <li>Crie um arquivo <code className="bg-slate-700 px-2 py-1 rounded text-amber-300">.env</code> na raiz do projeto</li>
            <li>Adicione as variaveis:
              <pre className="bg-slate-950 p-3 rounded mt-2 text-sm text-green-400 overflow-x-auto">
{`VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
VITE_GOOGLE_CLIENT_ID=seu-client-id-google
VITE_GOOGLE_CLIENT_SECRET=seu-client-secret-google`}
              </pre>
            </li>
            <li>Execute <code className="bg-slate-700 px-2 py-1 rounded text-amber-300">npm run build</code> novamente</li>
            <li>Reinicie o servidor com <code className="bg-slate-700 px-2 py-1 rounded text-amber-300">npm run start</code></li>
          </ol>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>Dica: Voce pode obter as credenciais do Supabase em:</p>
          <a 
            href="https://supabase.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-amber-400 hover:underline"
          >
            https://supabase.com/dashboard
          </a>
          <span className="mx-2">→</span>
          <span>Seu Projeto → Settings → API</span>
        </div>
      </div>
    </div>
  );
}
