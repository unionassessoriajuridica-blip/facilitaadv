import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Verifica se a meta tag já existe com tipagem correta
let metaTag: HTMLMetaElement | null = document.querySelector('meta[name="google-signin-client_id"]');

if (!metaTag) {
  metaTag = document.createElement('meta') as HTMLMetaElement;
  metaTag.name = 'google-signin-client_id';
  document.head.appendChild(metaTag);
}

// Atualiza o conteúdo
if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  metaTag.content = import.meta.env.VITE_GOOGLE_CLIENT_ID;
} else {
  console.error('VITE_GOOGLE_CLIENT_ID não está definida no ambiente.');
}

createRoot(document.getElementById("root")!).render(<App />);