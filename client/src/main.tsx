import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { isSupabaseConfigured } from './integrations/supabase/client'
import { EnvErrorScreen } from './components/EnvErrorScreen'

const missingVars: string[] = [];

if (!import.meta.env.VITE_SUPABASE_URL) {
  missingVars.push('VITE_SUPABASE_URL');
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  missingVars.push('VITE_SUPABASE_ANON_KEY');
}

let metaTag: HTMLMetaElement | null = document.querySelector('meta[name="google-signin-client_id"]');

if (!metaTag) {
  metaTag = document.createElement('meta') as HTMLMetaElement;
  metaTag.name = 'google-signin-client_id';
  document.head.appendChild(metaTag);
}

if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  metaTag.content = import.meta.env.VITE_GOOGLE_CLIENT_ID;
} else {
  console.warn('VITE_GOOGLE_CLIENT_ID nao esta definida. Integracao Google nao funcionara.');
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('Elemento root nao encontrado no HTML');
} else {
  const root = createRoot(rootElement);
  
  if (missingVars.length > 0 || !isSupabaseConfigured()) {
    root.render(<EnvErrorScreen missingVars={missingVars} />);
  } else {
    root.render(<App />);
  }
}
