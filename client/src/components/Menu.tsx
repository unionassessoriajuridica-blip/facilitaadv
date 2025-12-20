import * as React from "react";
// src/components/FrontendMenu.tsx
import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export const FrontendMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Versão Desktop (aparece em telas médias/grandes) */}
      <div className="hidden md:flex items-center space-x-6 text-lg">
        <Link 
          to="/" 
          className="px-3 py-2 text-sm font-medium hover:text-primary transition-colors"
        >
          Início
        </Link>
        <Link 
          to="/servicos" 
          className="px-3 py-2 text-sm font-medium hover:text-primary transition-colors"
        >
          Serviços
        </Link>
        <Link 
          to="/contato" 
          className="px-3 py-2 text-sm font-medium hover:text-primary transition-colors"
        >
          Contato
        </Link>
        <Link 
          to="/sobre" 
          className="px-3 py-2 text-sm font-medium hover:text-primary transition-colors"
        >
          Sobre
        </Link>
      </div>

      {/* Versão Mobile (aparece em telas pequenas) */}
      <div className="md:hidden">
        {/* Botão do menu hamburguer */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Menu dropdown mobile */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1 flex flex-col">
              <Link 
                to="/" 
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-gray-100"
              >
                Início
              </Link>
              <Link 
                to="/servicos" 
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-gray-100"
              >
                Serviços
              </Link>
              <Link 
                to="/contato" 
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-gray-100"
              >
                Contato
              </Link>
              <Link 
                to="/sobre" 
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-gray-100"
              >
                Sobre
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};