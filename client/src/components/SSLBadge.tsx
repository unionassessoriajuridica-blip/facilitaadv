import * as React from "react";
import { Shield } from "lucide-react";

const SSLBadge = () => {
  return (
    <div className="fixed bottom-4 right-4 bg-success text-success-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium">
      <Shield className="w-4 h-4" />
      <div className="flex flex-col leading-tight">
        <span>✓ SSL 256-bit Ativo</span>
        <span className="text-xs opacity-90">TLS 1.3 • AES-256-GCM</span>
      </div>
    </div>
  );
};

export default SSLBadge;