/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'sweetalert2' {
  interface SweetAlertOptions {
    customClass?: {
      popup?: string;
      container?: string;
      header?: string;
      title?: string;
      closeButton?: string;
      icon?: string;
      image?: string;
      content?: string;
      input?: string;
      actions?: string;
      confirmButton?: string;
      cancelButton?: string;
      footer?: string;
    };
  }
}