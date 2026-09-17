import React from 'react'
import { ArrowUpRight } from 'lucide-react'
import HeroCallout from '@/components/HeroCallout'
import brandConfig from '@/data/brandConfig.json'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="relative mt-auto w-full border-t border-border/40 bg-background/50 overflow-hidden">
            {/* Minimalist Top CMYK Accent Line */}
            <div className="h-0.5 w-full flex opacity-70">
                <div className="flex-1 bg-cyan-400" />
                <div className="flex-1 bg-pink-500" />
                <div className="flex-1 bg-yellow-400" />
                <div className="flex-1 bg-foreground" />
            </div>

            <div className="container mx-auto px-4 py-12 md:py-16 flex flex-col gap-12">
                {/* Hero Callout Component */}
                <HeroCallout />

                {/* Main Content Area (Clean typographic elegance) */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    
                    {/* Brand & Mission Statement */}
                    <div className="max-w-md space-y-3">
                        <a href="/" className="inline-block group">
                            <span className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                RS Prints
                            </span>
                        </a>
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                            Crafting high-definition custom apparel, personalized gifts, and creative merchandise. Made with precision, delivered to your doorstep.
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-2.5 pt-1">
                            <a
                                href={brandConfig.socials.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Follow RS Prints on Instagram"
                                className="size-9 rounded-xl border border-border/80 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs"
                            >
                                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                            <a
                                href={brandConfig.socials.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Follow RS Prints on Facebook"
                                className="size-9 rounded-xl border border-border/80 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs"
                            >
                                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                            <a
                                href={brandConfig.socials.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Follow RS Prints on X (Twitter)"
                                className="size-9 rounded-xl border border-border/80 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs"
                            >
                                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a
                                href={brandConfig.contact.whatsapp.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Chat with RS Prints on WhatsApp"
                                className="size-9 rounded-xl border border-border/80 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs"
                            >
                                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Navigation, Legal & Helpdesk */}
                    <div className="flex flex-wrap items-start sm:items-center gap-x-6 sm:gap-x-7 gap-y-3 text-sm font-medium">
                        <a 
                            href="/about" 
                            className="text-foreground/80 hover:text-foreground transition-colors hover:underline underline-offset-4"
                        >
                            About Us
                        </a>
                        <a 
                            href="/reviews" 
                            className="text-foreground/80 hover:text-foreground transition-colors hover:underline underline-offset-4"
                        >
                            Happy Customers
                        </a>
                        <a 
                            href="/privacy-policy" 
                            className="text-foreground/80 hover:text-foreground transition-colors hover:underline underline-offset-4"
                        >
                            Privacy Policy
                        </a>
                        <a 
                            href="/terms-and-conditions" 
                            className="text-foreground/80 hover:text-foreground transition-colors hover:underline underline-offset-4"
                        >
                            Terms & Conditions
                        </a>
                        <a 
                            href="/shipping-and-refund-policy" 
                            className="text-foreground/80 hover:text-foreground transition-colors hover:underline underline-offset-4"
                        >
                            Shipping & Returns
                        </a>
                        <a 
                            href="/faq" 
                            className="text-foreground/80 hover:text-foreground transition-colors hover:underline underline-offset-4"
                        >
                            FAQs
                        </a>
                        <a 
                            href="/contact" 
                            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline underline-offset-4"
                        >
                            Contact Desk
                            <ArrowUpRight className="size-4" />
                        </a>
                    </div>
                </div>

                {/* Bottom Separator & Copyright Row */}
                <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <span>© {currentYear} RS Prints. All rights reserved.</span>
                        <div className="hidden sm:flex items-center gap-1 opacity-60" title="CMYK Press Proof">
                            <span className="size-1.5 rounded-full bg-cyan-400" />
                            <span className="size-1.5 rounded-full bg-pink-500" />
                            <span className="size-1.5 rounded-full bg-yellow-400" />
                            <span className="size-1.5 rounded-full bg-foreground" />
                        </div>
                    </div>
                    <span>Crafted for creators & custom apparel.</span>
                </div>

               

            </div>
        </footer>
    )
}
