import * as React from "react";
import React from 'react';

interface ImageTextProps {
  imageUrl: string;
  altText: string;
  text: React.ReactNode;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
}

export function ImageHeader({ 
  imageUrl, 
  altText, 
  text, 
  className = "", 
  imageClassName = "w-8 h-8",
  textClassName = "text-4xl md:text-5xl font-bold text-foreground leading-tight"
}: ImageTextProps) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <img 
        src={imageUrl} 
        alt={altText}
        className={`${imageClassName} mr-3 object-contain`}
      />
      <span className={textClassName}>{text}</span>
    </div>
  );
}