import * as React from "react";
import Header from '@/components/Header';
import SSLBadge from '@/components/SSLBadge';
import { Footer } from '@/components/Footer';

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="prose prose-lg prose-blue mx-auto">
          <h1 className="text-3xl font-bold mb-4">Política de Privacidade - FacilitaAdv</h1>
          <p className="mb-6"><strong>Última atualização: 7 de agosto de 2025</strong></p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">1. Informações Coletadas</h2>
            <p className="mb-2">Coletamos:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Dados cadastrais (nome, email, OAB)</li>
              <li>Dados de processos jurídicos</li>
              <li>Informações de pagamento (processadas por terceiros)</li>
              <li>Dados de uso da plataforma</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">2. Uso das Informações</h2>
            <p className="mb-2">Seus dados são usados para:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Personalizar sua experiência</li>
              <li>Garantir segurança (com criptografia SSL 256-bit)</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">3. Compartilhamento de Dados</h2>
            <p className="mb-2">Seus dados podem ser compartilhados com:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Prestadores de serviços essenciais</li>
              <li>Autoridades legais quando exigido por lei</li>
              <li>Com seu consentimento explícito</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">4. Segurança</h2>
            <p className="mb-2">Implementamos:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Criptografia SSL 256-bit em todos os dados</li>
              <li>Controles de acesso rigorosos</li>
              <li>Auditorias regulares de segurança</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">5. Seus Direitos</h2>
            <p className="mb-2">Você pode:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Acessar seus dados pessoais</li>
              <li>Solicitar correção ou exclusão</li>
              <li>Revogar consentimentos</li>
              <li>Obter portabilidade de dados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">6. Cookies e Tecnologias Similares</h2>
            <p className="mb-4">Usamos cookies essenciais para operação da plataforma e de segurança.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">7. Alterações nesta Política</h2>
            <p className="mb-4">Notificaremos sobre mudanças significativas em nossa Política de Privacidade.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">8. Contato</h2>
            <p className="mb-4">Para exercer seus direitos ou dúvidas: <a href="mailto:privacidade@facilita.adv.br" className="text-blue-600 hover:underline">privacidade@facilita.adv.br</a></p>
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