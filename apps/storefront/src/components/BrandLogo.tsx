import React from 'react'

interface BrandLogoProps {
  className?: string
}

function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <a href="/" data-astro-prefetch="hover" className={`flex items-center gap-2 sm:gap-2.5 group select-none ${className}`}>
      <img
        src="/favicon.png"
        alt="RS Prints Logo"
        className="size-7 md:size-8 object-contain shrink-0 transition-transform group-hover:scale-105"
      />
      <h1 className="font-heading text-lg md:text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
        RS Prints
      </h1>
    </a>
  )
}

export default BrandLogo
