import React from 'react'
import { Sparkles, ArrowUpRight } from 'lucide-react'

export default function HeroCallout() {
    return (
        <div className="relative rounded-3xl border border-border/80 bg-card p-6 sm:p-8 md:p-10 shadow-xs overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Subtle Glow Backdrop */}
            <div className="absolute -right-16 -top-16 size-64 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

            <div className="space-y-3 max-w-xl z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-foreground border border-primary/40">
                    <Sparkles className="size-3.5 text-primary" />
                    Custom Print Studio & Merchandise
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground tracking-tight leading-tight">
                    Got an idea to print? <br />
                    <span className="text-muted-foreground font-normal">Let’s put it on something real.</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Personalized photo gifts, corporate branding, custom apparel, and vibrant prints manufactured with precision and love.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto z-10">
                <a
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:brightness-105 active:scale-[0.98] transition-all"
                >
                    Start Custom Order
                    <ArrowUpRight className="size-4" />
                </a>
                <a
                    href="/reviews"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-border bg-background hover:bg-muted/70 text-foreground text-sm font-medium transition-all"
                >
                    Customer Reviews
                </a>
            </div>
        </div>
    )
}
