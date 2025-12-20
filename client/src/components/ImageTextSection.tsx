import * as React from "react";
import React from 'react';
interface ImageTextSectionProps {
  imageUrl: string;
  title: string;
  text: string;
  features: string[];
  reverse?: boolean;
}

export function ImageTextSection({
  imageUrl,
  title,
  text,
  features,
  reverse = false
}: ImageTextSectionProps) {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}>
          {/* Imagem */}
          <div className="md:w-1/2">
            <img 
              src={imageUrl} 
              alt="" 
              className="w-full h-auto rounded-xl shadow-lg object-cover"
            />
          </div>
          
          {/* Texto */}
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">{title}</h2>
            <p className="text-gray-600 mb-6">{text}</p>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-1 mr-2 flex-shrink-0">
                    <path stroke="currentColor" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}