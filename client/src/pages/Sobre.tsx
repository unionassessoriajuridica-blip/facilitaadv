import * as React from "react";
import Header from '@/components/Header';
import SSLBadge from '@/components/SSLBadge';
import { Footer } from '@/components/Footer';

export default function Sobre() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Seção Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">Sobre o FacilitaAdv</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transformando a prática jurídica através da tecnologia e segurança digital
          </p>
        </section>

        {/* Seção Missão */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Nossa Missão</h2>
            <p className="text-gray-600 mb-6">
              Oferecer a advogados e escritórios de advocacia ferramentas tecnológicas que simplificam processos, 
              garantindo segurança e eficiência no dia a dia jurídico.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Valores</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Inovação contínua</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Transparência</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Ética profissional</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Compromissos</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Segurança de dados</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Conformidade legal</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-1 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Suporte especializado</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Tecnologia */}
        <section className="mb-12">
          <div className="bg-blue-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Nossa Tecnologia</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Criptografia SSL 256-bit</h3>
                <p className="text-gray-600">
                  Proteção militar para todos os dados armazenados e transmitidos pela plataforma.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Inteligência Artificial</h3>
                <p className="text-gray-600">
                  Automação inteligente de processos jurídicos repetitivos.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Cloud Seguro</h3>
                <p className="text-gray-600">
                  Infraestrutura em nuvem com backups diários e redundância.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Equipe */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Conheça Nossa Equipe</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-100 h-48 flex items-center justify-center">
                <svg className="w-24 h-24 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">Dr. Carlos Silva</h3>
                <p className="text-blue-600 mb-3">CEO & Fundador</p>
                <p className="text-gray-600">
                  Advogado com 15 anos de experiência em direito digital e proteção de dados.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-100 h-48 flex items-center justify-center">
                <svg className="w-24 h-24 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">Dra. Ana Oliveira</h3>
                <p className="text-blue-600 mb-3">CTO</p>
                <p className="text-gray-600">
                  Especialista em tecnologia jurídica e desenvolvimento de sistemas seguros.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-100 h-48 flex items-center justify-center">
                <svg className="w-24 h-24 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">Dr. Marcos Rocha</h3>
                <p className="text-blue-600 mb-3">Diretor Jurídico</p>
                <p className="text-gray-600">
                  Responsável pela conformidade legal e ética de todas as nossas soluções.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seção CTA */}
        <section className="bg-blue-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Pronto para transformar seu escritório?</h2>
          <p className="text-xl mb-6 max-w-2xl mx-auto">
            Experimente gratuitamente por 7 dias e comprove os benefícios.
          </p>
          <button className="bg-white text-blue-600 font-medium py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">
            Comece Agora
          </button>
        </section>
      </main>

      <div className="mt-8 flex justify-center">
        <SSLBadge />
      </div>
      
      <Footer />
    </div>
  );
}