"use client"

import React from "react"
import { Palette, Sparkles, Plus, ExternalLink } from "lucide-react"

export default function SavedCreationsView() {
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-heading sm:font-sans">
            Saved Creation
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Your customized artwork, personalized prints, and saved design drafts.
          </p>
        </div>

        <a
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f0643b] hover:bg-[#df562f] text-white text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="size-4" />
          Create New Design
        </a>
      </div>

      {/* Empty State matching badge 0 from screenshot */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 sm:p-16 text-center shadow-xs">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-neutral-50 text-neutral-400 mb-4 border border-neutral-100">
          <Palette className="size-8" />
        </div>
        <h3 className="text-base font-bold text-neutral-900 mb-1.5">No Saved Creations Yet</h3>
        <p className="text-xs text-neutral-500 max-w-md mx-auto mb-6 leading-relaxed">
          Design your personalized T-Shirts, Coffee Mugs, Photo Frames, and Keychains. Save your work in progress to quickly order anytime.
        </p>
        <a
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-all"
        >
          <Sparkles className="size-4 text-amber-400" />
          Browse Customizable Products
        </a>
      </div>
    </div>
  )
}
