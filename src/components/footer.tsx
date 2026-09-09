import React from 'react'
import { ArrowUpRight } from 'lucide-react'
import HeroCallout from '@/components/HeroCallout'

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
