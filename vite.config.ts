import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    root: path.resolve(__dirname, "client"),
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client/src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },

    // ⚡ Otimizações de Performance
    optimizeDeps: {
      // Pré-otimizar apenas dependências críticas do cliente
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'wouter',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-select',
        '@radix-ui/react-toast',
      ],
      // Excluir pacotes pesados e server-side da otimização
      exclude: [
        '@supabase/supabase-js',
        'googleapis',
        'node-cron',
      ]
    },

    // Cache persistente para startups mais rápidos
    cacheDir: 'node_modules/.vite',

    define: {
      "import.meta.env.VITE_APP_URL": JSON.stringify(env.VITE_APP_URL),
      "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(
        env.VITE_GOOGLE_CLIENT_ID
      ),
      "import.meta.env.VITE_GOOGLE_CLIENT_SECRET": JSON.stringify(
        env.VITE_GOOGLE_CLIENT_SECRET
      ),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY
      ),
      "import.meta.env.MODE": JSON.stringify(mode),
    },
    envPrefix: "VITE_",
    build: {
      outDir: path.resolve(__dirname, "server/public"),
      emptyOutDir: true,
    },
  };
});
