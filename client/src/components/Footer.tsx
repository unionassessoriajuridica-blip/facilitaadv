import * as React from "react";
// src/components/Footer.tsx
import { Link } from "react-router-dom";

import SSLBadge from '@/components/SSLBadge';

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-6">
        {/* Layout para Desktop (md para cima) */}
        <div className="hidden md:flex justify-between items-center">
          <div>
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FacilitaAdv - Todos os direitos reservados
            </span>
          </div>
          <div className="flex gap-6">
            <Link 
              to="/termos-servico" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Termos de Serviço
            </Link>
            <Link 
              to="/politica-privacidade" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Política de Privacidade
            </Link>
            <Link 
              to="/contato" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Contato
            </Link>
          </div>
        </div>

        {/* Layout para Mobile (md para baixo) */}
        <div className="md:hidden">
          <div className="flex flex-col items-center space-y-4">
            {/* Links em coluna */}
            <div className="flex flex-col items-center space-y-3">
              <Link 
                to="/termos-servico" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Termos de Serviço
              </Link>
              <Link 
                to="/politica-privacidade" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Política de Privacidade
              </Link>
              <Link 
                to="/contato" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Contato
              </Link>
            </div>
            
            {/* Copyright centralizado */}
            <div className="text-center">
              <span className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} FacilitaAdv
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os direitos reservados
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 md:mt-4 flex justify-center md:justify-start items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Sistema protegido com SSL 256-bit
          </span>
        </div>
      </div>
    </footer>
  );
};