import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Scale,
  Menu,
  X,
  ShieldCheck,
  Award,
  Gavel,
  CheckCircle,
  Target,
  Zap,
  Lock,
  ArrowRight
} from "lucide-react";
import { SiFacebook, SiX, SiLinkedin } from "react-icons/si";

const Sobre = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      
      {/* --- HEADER (Identidade da Home) --- */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-400" />
            <span className="font-bold text-lg tracking-tight">Facilita ADV</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">Solucoes</Link>
            <Link to="/" className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">Funcionalidades</Link>
            <Link to="/" className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">Seguranca</Link>
            <Link to="/sobre" className="text-sm text-amber-300 transition-colors font-bold underline decoration-amber-500 underline-offset-4">Sobre</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth")}
              className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 font-semibold transition-all"
            >
              Login
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
            <Link to="/" className="block text-sm text-amber-400 hover:text-amber-300 font-medium">Solucoes</Link>
            <Link to="/" className="block text-sm text-amber-400 hover:text-amber-300 font-medium">Funcionalidades</Link>
            <Link to="/" className="block text-sm text-amber-400 hover:text-amber-300 font-medium">Seguranca</Link>
            <Link to="/sobre" className="block text-sm text-white font-bold">Sobre</Link>
          </div>
        )}
      </header>

      {/* --- HERO SECTION (Estilo Dark da Home) --- */}
      <section className="relative py-24 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900"></div>
        </div>
        
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold uppercase tracking-wider mb-6 border border-amber-400/20">
            Excelência Jurídica
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Liderança & <span className="text-amber-400">Estratégia</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Uma trajetória marcada pela ética, combatividade e defesa intransigente dos direitos fundamentais.
          </p>
        </div>
      </section>

      {/* --- SEÇÃO FUNDADOR (Adaptada) --- */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-slate-100">
              
              {/* Imagem do Advogado */}
              <div className="lg:col-span-5 relative">
                <div className="relative group rounded-xl overflow-hidden shadow-2xl border-4 border-slate-900/5">
                  <div className="absolute inset-0 bg-amber-400/10 mix-blend-multiply z-10 pointer-events-none transition-opacity group-hover:opacity-0"></div>
                  <img 
                    src="/img/rafael-perfil.png" 
                    onError={(e) => {
                      e.currentTarget.src = "/img/rafael-perfil.png"; // Fallback se a imagem nova falhar
                    }}
                    alt="Dr. Rafael Anastácio"
                    className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Conteúdo */}
              <div className="lg:col-span-7 space-y-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                    Dr. Rafael Anastácio
                  </h2>
                  <p className="text-lg text-amber-600 font-bold uppercase tracking-wide flex items-center gap-2">
                    <Gavel className="w-5 h-5" />
                    Advogado Criminalista Especializado
                  </p>
                </div>

                <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                  <p>
                    Com mais de uma década de experiência exclusiva em Direito Criminal, 
                    <strong className="text-slate-900"> Dr. Rafael Anastácio</strong> é reconhecido pela sua atuação 
                    combativa e estratégica na defesa dos direitos fundamentais.
                  </p>
                  <p>
                    Especialista em casos urgentes, audiências de custódia e defesas complexas 
                    em todas as instâncias do judiciário brasileiro.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border-l-4 border-amber-400 shadow-sm">
                    <ShieldCheck className="w-6 h-6 text-amber-500" />
                    <span className="font-semibold text-slate-800">Defesa Combativa</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border-l-4 border-amber-400 shadow-sm">
                    <Award className="w-6 h-6 text-amber-500" />
                    <span className="font-semibold text-slate-800">Excelência Técnica</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- MISSÃO E VALORES (Restaurada com Paleta Nova) --- */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Nossa Missão</h2>
              <p className="text-lg text-slate-600">
                Oferecer defesa jurídica de excelência, combinando conhecimento técnico aprofundado com ferramentas tecnológicas que garantem agilidade e segurança.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 border-b border-amber-200 pb-2">
                  <Target className="text-amber-500 h-6 w-6" />
                  Valores Inegociáveis
                </h3>
                <ul className="space-y-4">
                  {[
                    "Combate incessante por justiça",
                    "Transparência absoluta com o cliente",
                    "Ética profissional rigorosa"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start bg-slate-50 p-3 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-amber-500 mt-0.5 mr-3 shrink-0" />
                      <span className="text-slate-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 border-b border-amber-200 pb-2">
                  <Award className="text-amber-500 h-6 w-6" />
                  Nosso Compromisso
                </h3>
                <ul className="space-y-4">
                  {[
                    "Segurança total de dados e sigilo",
                    "Atendimento humanizado e direto",
                    "Disponibilidade para urgências 24h"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start bg-slate-50 p-3 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-amber-500 mt-0.5 mr-3 shrink-0" />
                      <span className="text-slate-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TECNOLOGIA (Visual Dark da Home) --- */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Tecnologia & Segurança</h2>
            <div className="w-20 h-1 bg-amber-400 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 hover:border-amber-400/50 transition-colors group">
              <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center mb-6 group-hover:bg-amber-400/10 transition-colors">
                <Lock className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Criptografia de Ponta</h3>
              <p className="text-slate-400 leading-relaxed">
                Proteção de nível bancário para todos os dados, documentos e comunicações do seu processo.
              </p>
            </div>

            <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 hover:border-amber-400/50 transition-colors group">
              <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center mb-6 group-hover:bg-amber-400/10 transition-colors">
                <Zap className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Agilidade Processual</h3>
              <p className="text-slate-400 leading-relaxed">
                Sistemas proprietários de monitoramento 24/7 de andamentos processuais e publicações.
              </p>
            </div>

            <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 hover:border-amber-400/50 transition-colors group">
              <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center mb-6 group-hover:bg-amber-400/10 transition-colors">
                <ShieldCheck className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Cloud Seguro</h3>
              <p className="text-slate-400 leading-relaxed">
                Infraestrutura em nuvem privada com backups diários e redundância total de dados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA (Call to Action - Dourado) --- */}
      <section className="py-16 bg-amber-400">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            Precisa de orientação jurídica urgente?
          </h2>
          <p className="text-xl text-slate-800 mb-8 max-w-2xl mx-auto font-medium">
            Não espere o problema se agravar. Entre em contato agora para uma análise preliminar e sigilosa do seu caso.
          </p>
          <Button 
            onClick={() => navigate("/contato")}
            size="lg" 
            className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
          >
            Falar com Especialista <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* --- FOOTER (Identidade da Home) --- */}
      <footer className="bg-slate-900 text-white py-16 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h4 className="font-bold text-lg mb-6 text-white border-l-4 border-amber-400 pl-3">Navegação</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-amber-400 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-amber-400 rounded-full"></span>Inicio</Link></li>
                <li><Link to="/sobre" className="hover:text-amber-400 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-amber-400 rounded-full"></span>Sobre Nós</Link></li>
                <li><Link to="/contato" className="hover:text-amber-400 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-amber-400 rounded-full"></span>Contato</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6 text-white border-l-4 border-amber-400 pl-3">Funcionalidades</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-amber-400 transition-colors">Carreiras</Link></li>
                <li><Link to="/" className="hover:text-amber-400 transition-colors">Visão</Link></li>
                <li><Link to="/" className="hover:text-amber-400 transition-colors">Previsibilidade</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-white border-l-4 border-amber-400 pl-3">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link to="/politica-privacidade" className="hover:text-amber-400 transition-colors">Politica de Privacidade</Link></li>
                <li><Link to="/termos-servico" className="hover:text-amber-400 transition-colors">Termos de Uso</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-white border-l-4 border-amber-400 pl-3">Conecte-se</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-amber-400 hover:text-slate-900 transition-all duration-300">
                  <SiFacebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-amber-400 hover:text-slate-900 transition-all duration-300">
                  <SiX className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-amber-400 hover:text-slate-900 transition-all duration-300">
                  <SiLinkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-medium text-slate-300">Facilita ADV - Escritorio de Advocacia Digital</span>
            </div>
            <span className="text-xs text-gray-500">© 2024 Todos os direitos reservados</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Sobre;