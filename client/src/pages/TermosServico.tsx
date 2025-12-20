import * as React from "react";
import Header from '@/components/Header';
import SSLBadge from '@/components/SSLBadge';
import { Footer } from '@/components/Footer';

export default function TermosServico() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="prose prose-lg prose-blue mx-auto">
          <h1 className="text-3xl font-bold mb-4">Termos de Serviço - FacilitaAdv</h1>
          <p className="mb-6"><strong>Última atualização: 7 de agosto de 2025</strong></p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">1. Aceitação dos Termos</h2>
            <p className="mb-4">Ao acessar ou usar o FacilitaAdv em https://www.facilita.adv.br, você concorda com estes Termos.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">2. Serviços Oferecidos</h2>
            <p className="mb-2">O FacilitaAdv fornece:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Automação de tarefas jurídicas</li>
              <li>Organização de processos judiciais</li>
              <li>Geração de petições e documentos</li>
              <li>Agenda e notificações automatizadas</li>
              <li>Armazenamento seguro de dados com criptografia SSL 256-bit</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">3. Responsabilidades do Usuário</h2>
            <p className="mb-2">Você concorda em:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Fornecer informações precisas e atualizadas</li>
              <li>Manter a confidencialidade de sua senha</li>
              <li>Não utilizar a plataforma para atividades ilegais</li>
              <li>Responsabilizar-se por todo conteúdo inserido</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">4. Segurança de Dados</h2>
            <p className="mb-2">Empregamos criptografia SSL 256-bit para proteger seus dados, porém:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Você é responsável por backups adicionais</li>
              <li>Devemos ser notificados imediatamente sobre violações de segurança</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">5. Propriedade Intelectual</h2>
            <p className="mb-4">Todo conteúdo gerado pelo usuário permanece de sua propriedade. A plataforma e seus elementos são propriedade do FacilitaAdv.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">6. Modificações</h2>
            <p className="mb-4">Podemos alterar estes Termos a qualquer momento. Alterações serão comunicadas por email.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">7. Contato</h2>
            <p className="mb-4">Dúvidas sobre estes Termos? Entre em contato em <a href="mailto:contato@facilita.adv.br" className="text-blue-600 hover:underline">contato@facilita.adv.br</a></p>
          </section>
        </article>
        <div className="mt-8 flex justify-center">
          <SSLBadge />
        </div>
      </main>
      <Footer />
    </div>
  );
}