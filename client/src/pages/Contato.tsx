import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale, Menu, X, Phone, MapPin, Mail, Clock } from "lucide-react";
import { SiFacebook, SiX, SiLinkedin } from "react-icons/si";
import SSLBadge from "@/components/SSLBadge";

export default function Contato() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      
      {/* --- HEADER (Cópia exata da Home / Index.tsx) --- */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-400" />
            <span className="font-bold text-lg">Facilita ADV</span>
          </div>
          
          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">
              Solucoes
            </Link>
            <Link to="/" className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">
              Funcionalidades
            </Link>
            <Link to="/" className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">
              Seguranca
            </Link>
            <Link
              to="/sobre"
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
            >
              Sobre
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth")}
              className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 transition-all"
            >
              Login
            </Button>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 px-4 py-3 space-y-2 border-t border-slate-700">
            <Link to="/" className="block w-full text-left text-sm text-amber-400 hover:text-amber-300 py-2 font-medium">
              Solucoes
            </Link>
            <Link to="/" className="block w-full text-left text-sm text-amber-400 hover:text-amber-300 py-2 font-medium">
              Funcionalidades
            </Link>
            <Link to="/" className="block w-full text-left text-sm text-amber-400 hover:text-amber-300 py-2 font-medium">
              Seguranca
            </Link>
            <Link
              to="/sobre"
              className="block text-sm text-amber-400 hover:text-amber-300 py-2 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sobre
            </Link>
          </div>
        )}
      </header>

      {/* --- CONTEÚDO PRINCIPAL (Adaptado para estilo Dark/Amber) --- */}
      <main className="flex-grow py-12 bg-gray-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Entre em Contato</h1>
            <div className="w-24 h-1 bg-amber-400 mx-auto rounded-full"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Estamos prontos para atender você. Utilize os canais abaixo ou visite nosso escritório.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Seção de Informações de Contato (Esquerda) */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 border-l-4 border-amber-400 pl-4">
                Canais de Atendimento
              </h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg group-hover:bg-amber-400 group-hover:text-slate-900 transition-colors text-amber-600 dark:text-amber-400">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Telefone</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 font-medium">(16) 99350-8206</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg group-hover:bg-amber-400 group-hover:text-slate-900 transition-colors text-amber-600 dark:text-amber-400">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Endereço</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                      R. Alice Além Saadi, 855 - Sala 904<br />
                      Nova Ribeirânia, Ribeirão Preto - SP<br />
                      CEP 14096-570
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg group-hover:bg-amber-400 group-hover:text-slate-900 transition-colors text-amber-600 dark:text-amber-400">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Email</h3>
                    <a href="mailto:unionassessoriajuridica@gmail.com" className="text-amber-600 dark:text-amber-400 hover:underline mt-1 block font-medium">
                      unionassessoriajuridica@gmail.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg group-hover:bg-amber-400 group-hover:text-slate-900 transition-colors text-amber-600 dark:text-amber-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Horário de Atendimento</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                      Segunda a Domingo: <span className="font-semibold text-amber-600 dark:text-amber-400">24h de atendimento</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção do Mapa (Direita) */}
            <div className="h-full bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 border-l-4 border-amber-400 pl-4">
                Nossa Localização
              </h2>
              <div className="flex-grow rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-600 relative">
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3719.966779836934!2d-47.80386162394666!3d-21.19349198583713!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94b9bef0a7afb031%3A0x62973434676579e0!2sR.%20Alice%20Al%C3%A9m%20Saadi%2C%20855%20-%20Nova%20Ribeir%C3%A2nia%2C%20Ribeir%C3%A3o%20Preto%20-%20SP%2C%2014096-570!5e0!3m2!1spt-BR!2sbr!4v1709328472815!5m2!1spt-BR!2sbr"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '400px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="relative z-10 w-full h-full"
                ></iframe>
              </div>
            </div>
          </div>
          
          <div className="mt-16 flex justify-center">
            <SSLBadge />
          </div>
        </div>
      </main>

      {/* --- FOOTER (Cópia exata da Home / Index.tsx) --- */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4 text-white">Sobre</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/" className="hover:text-amber-400 transition-colors">Inicio</Link>
                </li>
                <li>
                  <Link to="/sobre" className="hover:text-amber-400 transition-colors">Sobre Nos</Link>
                </li>
                <li>
                  <Link to="/contato" className="hover:text-amber-400 transition-colors">Contato</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Funcionalidades</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/" className="hover:text-amber-400 transition-colors">Carreiras</Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-amber-400 transition-colors">Visao</Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-amber-400 transition-colors">Previsibilidade</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Seguranca</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/politica-privacidade" className="hover:text-amber-400 transition-colors">
                    Politica de Privacidade
                  </Link>
                </li>
                <li>
                  <Link to="/termos-servico" className="hover:text-amber-400 transition-colors">
                    Termos de Servico
                  </Link>
                </li>
                <li>
                  <Link to="/termos-servico" className="hover:text-amber-400 transition-colors">
                    Termos & Condicoes
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Follow Us</h4>
              <div className="flex gap-3">
                <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-amber-400 hover:text-slate-900 transition-colors group">
                  <SiFacebook className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-amber-400 hover:text-slate-900 transition-colors group">
                  <SiX className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-amber-400 hover:text-slate-900 transition-colors group">
                  <SiLinkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <span className="text-sm">Facilita ADV - Escritorio de advocacia autônomo</span>
            </div>
            <span className="text-sm text-gray-400">© 2024 Todos os direitos reservados</span>
          </div>
        </div>
      </footer>
    </div>
  );
}