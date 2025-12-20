import * as React from "react";
import React from 'react';
import Header from '@/components/Header.tsx';
import SSLBadge from '@/components/SSLBadge.tsx';
import { Footer } from '@/components/Footer.tsx';

export default function Contato() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Contato</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Seção de Informações de Contato (Esquerda) */}
          <div className="md:w-1/2 bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-6">Informações de Contato</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">Telefone</h3>
                <p className="text-gray-600">(16) 99350-8206</p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg">Endereço</h3>
                <p className="text-gray-600">
                  R. Alice Além Saadi, 855 - Sala 904<br />
                  Nova Ribeirânia<br />
                  Ribeira Preto - SP - CEP 14096-570
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg">Email</h3>
                <a href="mailto:unionassessoriajuridica@gmail.com" className="text-blue-600 hover:underline">
                  unionassessoriajuridica@gmail.com
                </a>
              </div>
              
              <div className="pt-4">
                <h3 className="font-medium text-lg">Horário de Atendimento</h3>
                <p className="text-gray-600">
                  Segunda a Domingo: 24h de atendimento<br />
                </p>
              </div>
            </div>
          </div>
          {/* Seção do Mapa (Direita) */}
          <div className="md:w-1/2">
            <div className="h-full bg-white p-4 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-4">Localização</h2>
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3719.8443829670036!2d-47.770652399999996!3d-21.198339999999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94b9b8acdd1007ab%3A0x3b7583ec79f443e7!2sR.%20Alice%20Al%C3%A9m%20Saadi%2C%20855%20-%20sala%20904%20-%20Nova%20Ribeir%C3%A2nia%2C%20Ribeir%C3%A3o%20Preto%20-%20SP%2C%2014096-570!5e0!3m2!1spt-BR!2sbr!4v1755774654788!5m2!1spt-BR!2sbr"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <SSLBadge />
        </div>
      </main>
      <Footer />
    </div>
  );
}