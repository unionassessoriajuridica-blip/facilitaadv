import * as React from "react";
import React from "react";
interface ParallaxHeroProps {
  backgroundImage: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  whatsappLink?: string;
}

export function Parallax({
  backgroundImage,
  title,
  subtitle,
  ctaText = "Saiba mais",
  whatsappLink,
}: ParallaxHeroProps) {
  return (
    <section className="relative h-[500px] overflow-hidden">
      {/* Imagem de fundo com efeito parallax */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed z-0"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      {/* Overlay escuro */}
      <div className="absolute inset-0 z-10" />

      {/* Conteúdo */}
      <div className="relative z-20 h-full flex flex-col justify-center items-center text-center px-4 text-gray-800">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 max-w-3xl">
          {title}
        </h2>
        <p className="text-xl mb-8 max-w-2xl">{subtitle}</p>

        {whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900 hover:bg-slate-700 text-white font-medium py-3 px-8 rounded-lg transition-colors"
          >
            ☑ {ctaText}
          </a>
        ) : (
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors">
            {ctaText}
          </button>
        )}
      </div>
    </section>
  );
}
