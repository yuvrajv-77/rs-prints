import React from 'react'
import { cn } from "cn"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export default function Navbar() {
    const navItemClassName = cn(
        navigationMenuTriggerStyle(),
        "h-8 px-2 py-1 text-xs xl:text-sm hover:underline hover:text-black whitespace-nowrap"
    )

    const subItemLinkClass = "block select-none rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium leading-normal no-underline outline-none transition-colors hover:bg-muted hover:text-foreground text-foreground/90"

    return (
        <NavigationMenu>
            <NavigationMenuList className="gap-0.5 md:gap-1 flex-wrap">
                
                {/* 1. Mugs Dropdown (46 items: Ceramic Mugs & Glass Mugs/Tumblers) */}
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={navItemClassName}>
                        Mugs
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[460px] sm:w-[560px] p-3.5">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Column 1: Ceramic Mugs (Top 10 + Shop all) */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50 flex items-center justify-between">
                                        <span>Ceramic Mugs</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">24 items</span>
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/white-mug-a001" className={subItemLinkClass}>
                                                        White Ceramic Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/motto-ceramic-mug-a111" className={subItemLinkClass}>
                                                        Motto Ceramic Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/cone-mug-a003" className={subItemLinkClass}>
                                                        Cone Ceramic Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/white-heart-handle-a004" className={subItemLinkClass}>
                                                        White Heart Handle Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/3-tone-heart-handle-a004c" className={subItemLinkClass}>
                                                        3-Tone Heart Handle Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/3-tone-mug-a006" className={subItemLinkClass}>
                                                        3-Tone Ceramic Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/neon-mug-a007" className={subItemLinkClass}>
                                                        Neon Vibrant Ceramic Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/golden-silver-mug-a008" className={subItemLinkClass}>
                                                        Golden &amp; Silver Plated Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/golden-handle-mug-a113" className={subItemLinkClass}>
                                                        Golden Handle Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/electro-plated-mug-silver-a112" className={subItemLinkClass}>
                                                        Electro Plated Silver Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li className="pt-0.5">
                                            <NavigationMenuLink
                                                render={
                                                    <a
                                                        href="/products?category=ceramic-mug"
                                                        className="block select-none rounded-lg px-2.5 py-1 text-xs font-semibold leading-normal text-primary hover:underline"
                                                    >
                                                        Shop all ceramic mugs &rarr;
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>

                                {/* Column 2: Glass Mugs & Tumblers (Top 10 + Shop all) */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50 flex items-center justify-between">
                                        <span>Glass &amp; Tumblers</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">22 items</span>
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/glass-mug-frosted-a015" className={subItemLinkClass}>
                                                        Frosted Glass Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/glass-mug-clear-a016" className={subItemLinkClass}>
                                                        Clear Glass Coffee Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/beer-glass-frosted-a018" className={subItemLinkClass}>
                                                        Frosted Beer Stein Glass
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/beer-glass-clear-a019" className={subItemLinkClass}>
                                                        Clear Pub Beer Glass
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/color-glass-mug-clear-a120" className={subItemLinkClass}>
                                                        Color Glass Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/gradient-color-glass-mug-frosted-a014" className={subItemLinkClass}>
                                                        Gradient Color Frosted Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/frosted-skinny-tumbler-bamboo-lid-a121" className={subItemLinkClass}>
                                                        Skinny Tumbler with Bamboo Lid
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/shot-glass-gold-rim-with-patch-a022" className={subItemLinkClass}>
                                                        Shot Glass (Gold Rim)
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/borosilicate-glass-mug-color-handle-clear-a115" className={subItemLinkClass}>
                                                        Borosilicate Color Handle Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/gradient-color-glass-tumbler-with-bamboo-lid-frosted-a142" className={subItemLinkClass}>
                                                        Glass Tumbler with Lid &amp; Straw
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li className="pt-0.5">
                                            <NavigationMenuLink
                                                render={
                                                    <a
                                                        href="/products?category=glass-mug"
                                                        className="block select-none rounded-lg px-2.5 py-1 text-xs font-semibold leading-normal text-primary hover:underline"
                                                    >
                                                        Shop all glass &amp; tumblers &rarr;
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>

                                {/* Bottom Bar: Direct Catalog Link */}
                                <div className="col-span-2 pt-2.5 mt-1 border-t border-border/50 flex items-center justify-between text-xs px-2.5">
                                    <span className="text-muted-foreground font-mono text-[11px]">
                                        46 Total Custom Printed Mugs
                                    </span>
                                    <a
                                        href="/products?category=mugs"
                                        className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        Shop all mugs &rarr;
                                    </a>
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                {/* 2. Drinkware Dropdown (26 items: Stainless Steel & Aluminium/Kids) */}
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={navItemClassName}>
                        Drinkware
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[460px] sm:w-[560px] p-3.5">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Column 1: Stainless Steel Drinkware (Top 10 + Shop all) */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50 flex items-center justify-between">
                                        <span>Stainless Steel</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">16 items</span>
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb27-stainless-steel-cap-vacuum-bottle-a131" className={subItemLinkClass}>
                                                        Vacuum Insulated Flask
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb30-double-wall-with-steel-cap-a130" className={subItemLinkClass}>
                                                        Double Wall Steel Cap Bottle
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb25-temperature-bottle-a151" className={subItemLinkClass}>
                                                        LED Temperature Bottle
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb16-cola-bottle-a027" className={subItemLinkClass}>
                                                        Cola Style Steel Bottle
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb21-skinny-tumbler-with-straw-a037" className={subItemLinkClass}>
                                                        Skinny Tumbler with Straw
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb20-yeti-coffee-mug-a036" className={subItemLinkClass}>
                                                        Yeti Style Coffee Mug
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb31-stainless-steel-mug-with-handle-side-lid-a132" className={subItemLinkClass}>
                                                        Travel Mug with Side Lid
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb17-double-wall-coke-can-a033" className={subItemLinkClass}>
                                                        Double Wall Coke Can
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb19-wine-cup-a035" className={subItemLinkClass}>
                                                        Wine Cup Tumbler
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb14-starbucks-tumbler-a030" className={subItemLinkClass}>
                                                        Starbucks Style Tumbler
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li className="pt-0.5">
                                            <NavigationMenuLink
                                                render={
                                                    <a
                                                        href="/products?category=stainless-steel-drinkware"
                                                        className="block select-none rounded-lg px-2.5 py-1 text-xs font-semibold leading-normal text-primary hover:underline"
                                                    >
                                                        Shop all stainless steel &rarr;
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>

                                {/* Column 2: Aluminium & Kids Bottles (10 Items) */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50 flex items-center justify-between">
                                        <span>Aluminium &amp; Kids</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">10 items</span>
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb5-bb6-a039" className={subItemLinkClass}>
                                                        Aluminium Sports Sipper
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb12-big-mouth-aluminium-a124" className={subItemLinkClass}>
                                                        Big Mouth Aluminium Bottle
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb7-bb8-a042" className={subItemLinkClass}>
                                                        Carabiner Clip Sipper
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb13-a040" className={subItemLinkClass}>
                                                        Classic White Metal Sipper
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb09-bb10-a043" className={subItemLinkClass}>
                                                        Ergonomic Fitness Bottle
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb26-a123" className={subItemLinkClass}>
                                                        Gloss Finish Sports Bottle
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb28-a127" className={subItemLinkClass}>
                                                        Matte Sports Sipper
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bb32-a150" className={subItemLinkClass}>
                                                        Lightweight Travel Flask
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/kids-water-bottle-a135" className={subItemLinkClass}>
                                                        Kids School Sipper Bottle
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/kids-water-bottle-a136" className={subItemLinkClass}>
                                                        Kids Leak-proof Sipper
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>

                                {/* Bottom Bar: Direct Catalog Link */}
                                <div className="col-span-2 pt-2.5 mt-1 border-t border-border/50 flex items-center justify-between text-xs px-2.5">
                                    <span className="text-muted-foreground font-mono text-[11px]">
                                        26 Total Custom Drinkware Products
                                    </span>
                                    <a
                                        href="/products?category=drinkware"
                                        className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        Shop all drinkware &rarr;
                                    </a>
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                {/* 3. Photo Frames Dropdown (33 items: MDF Collage & Glass/Stone) */}
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={navItemClassName}>
                        Photo Frames
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[460px] sm:w-[560px] p-3.5">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Column 1: MDF Collage Frames (Top 10 + Shop all) */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50 flex items-center justify-between">
                                        <span>Collage &amp; Wall</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">14 items</span>
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/sweet-heart-collage-frame-a053" className={subItemLinkClass}>
                                                        Sweet Heart Collage Frame
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/family-collage-frame-a054" className={subItemLinkClass}>
                                                        Family Collage Frame
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/love-collage-frame-a055" className={subItemLinkClass}>
                                                        Love Story Collage Frame
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/friends-collage-frame-a057" className={subItemLinkClass}>
                                                        Friends Collage Frame
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/birthday-collage-frame-a059" className={subItemLinkClass}>
                                                        Birthday Memory Collage
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/sweet-home-collage-frame-a060" className={subItemLinkClass}>
                                                        Sweet Home Wall Frame
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/happy-birthday-collage-frame-a061" className={subItemLinkClass}>
                                                        Happy Birthday Frame
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/12-number-clock-collage-frame-a062" className={subItemLinkClass}>
                                                        12 Number Clock Collage
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/forever-collage-frame-a063" className={subItemLinkClass}>
                                                        Forever Wooden Wall Frame
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/photo-clock-collage-frame-a064" className={subItemLinkClass}>
                                                        Photo Clock Wall Collage
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li className="pt-0.5">
                                            <NavigationMenuLink
                                                render={
                                                    <a
                                                        href="/products?category=mdf-collage-frame"
                                                        className="block select-none rounded-lg px-2.5 py-1 text-xs font-semibold leading-normal text-primary hover:underline"
                                                    >
                                                        Shop all collage frames &rarr;
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>

                                {/* Column 2: Glass & Stone Rock Frames (Top 10 + Shop all) */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50 flex items-center justify-between">
                                        <span>Glass &amp; Natural Stone</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">19 items</span>
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/semicircle-stone-frame-sh-01" className={subItemLinkClass}>
                                                        Semicircle Stone Rock Frame
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/natural-edge-stone-frame-sh-03" className={subItemLinkClass}>
                                                        Natural Edge Slate Plaque
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/up-opening-stone-frame-sh-05" className={subItemLinkClass}>
                                                        Up-Opening Stone Frame
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/right-open-stone-frame-sh-11" className={subItemLinkClass}>
                                                        Right-Open Rock Frame
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/square-stone-frame-sh-19" className={subItemLinkClass}>
                                                        Square Natural Slate Frame
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/wooden-frame-sh-38" className={subItemLinkClass}>
                                                        Wooden Stand Stone Frame
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bl-01-a090" className={subItemLinkClass}>
                                                        Beveled Glass Frame BL-01
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bl-03-a091" className={subItemLinkClass}>
                                                        Sublimation Glass BL-03
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bl-04-a092" className={subItemLinkClass}>
                                                        Curved Glass Desktop Frame
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/bl-11-a093" className={subItemLinkClass}>
                                                        Glass Photo Plaque BL-11
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li className="pt-0.5">
                                            <NavigationMenuLink
                                                render={
                                                    <a
                                                        href="/products?category=stone-frame"
                                                        className="block select-none rounded-lg px-2.5 py-1 text-xs font-semibold leading-normal text-primary hover:underline"
                                                    >
                                                        Shop all glass &amp; stone &rarr;
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>

                                {/* Bottom Bar: Direct Catalog Link */}
                                <div className="col-span-2 pt-2.5 mt-1 border-t border-border/50 flex items-center justify-between text-xs px-2.5">
                                    <span className="text-muted-foreground font-mono text-[11px]">
                                        33 Total Custom Photo Frames
                                    </span>
                                    <a
                                        href="/products?category=photo-frames"
                                        className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        Shop all photo frames &rarr;
                                    </a>
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                {/* 4. Pillows & Cushions Dropdown (15 items: Fur & Magic Sequin) */}
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={navItemClassName}>
                        Pillows
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[440px] sm:w-[540px] p-3.5">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Column 1: Fur Pillows (8 items) */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50 flex items-center justify-between">
                                        <span>Fur Cushions</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">8 items</span>
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/fur-square-red-a067" className={subItemLinkClass}>
                                                        Fur Square Red Cushion
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/long-fur-square-red-a068" className={subItemLinkClass}>
                                                        Long Fur Square Red
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/fur-square-pink-a069" className={subItemLinkClass}>
                                                        Fur Square Pink Cushion
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/fur-heart-red-a070" className={subItemLinkClass}>
                                                        Fur Heart Red Pillow
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/long-fur-heart-red-a071" className={subItemLinkClass}>
                                                        Long Fur Heart Red
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/fur-heart-pink-a072" className={subItemLinkClass}>
                                                        Fur Heart Pink Pillow
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/led-square-a073" className={subItemLinkClass}>
                                                        LED Glowing Square Pillow
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/led-heart-a074" className={subItemLinkClass}>
                                                        LED Glowing Heart Pillow
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>

                                {/* Column 2: Magic Sequin Pillows (7 items) */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50 flex items-center justify-between">
                                        <span>Magic Sequin</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">7 items</span>
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/magic-square-with-white-back-a075" className={subItemLinkClass}>
                                                        Magic Square (White Back)
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/magic-square-with-color-back-a076" className={subItemLinkClass}>
                                                        Magic Square (Color Back)
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/square-with-magic-patch-heart-emboss-a077" className={subItemLinkClass}>
                                                        Heart Emboss Magic Patch
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/square-with-magic-patch-love-emboss-a078" className={subItemLinkClass}>
                                                        Love Emboss Magic Patch
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/magic-heart-with-white-back-a079" className={subItemLinkClass}>
                                                        Magic Heart (White Back)
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/magic-heart-with-color-back-a080" className={subItemLinkClass}>
                                                        Magic Heart (Color Back)
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/magic-sublimation-flip-sequin-pillow-cover-a040" className={subItemLinkClass}>
                                                        Reversible Flip Sequin Cover
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>

                                {/* Bottom Bar: Direct Catalog Link */}
                                <div className="col-span-2 pt-2.5 mt-1 border-t border-border/50 flex items-center justify-between text-xs px-2.5">
                                    <span className="text-muted-foreground font-mono text-[11px]">
                                        15 Total Custom Pillows &amp; Cushions
                                    </span>
                                    <a
                                        href="/products?category=pillows-cushions"
                                        className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        Shop all pillows &rarr;
                                    </a>
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                {/* 5. MDF & Gifts Dropdown (30 items: Keychains, Plaques, Merchandise) */}
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={navItemClassName}>
                        Gifts &amp; MDF
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[460px] sm:w-[560px] p-3.5">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Column 1: Keychains & Keepsakes (9 items) */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50 flex items-center justify-between">
                                        <span>Keychains &amp; Keepsakes</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">9 items</span>
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/rectangular-mdf-keychain-a044" className={subItemLinkClass}>
                                                        Rectangular MDF Keychain
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/round-mdf-keychain-a045" className={subItemLinkClass}>
                                                        Round Wooden Keychain
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/heart-mdf-keychain-a046" className={subItemLinkClass}>
                                                        Heart Shaped MDF Keychain
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/rounded-rectangle-mdf-keychain-a047" className={subItemLinkClass}>
                                                        Rounded Rectangle Keychain
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/house-mdf-keychain-a048" className={subItemLinkClass}>
                                                        House Shaped Keychain
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/pentagon-mdf-keychain-a049" className={subItemLinkClass}>
                                                        Pentagon MDF Keychain
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/oval-mdf-keychain-a050" className={subItemLinkClass}>
                                                        Oval Wooden Keychain
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/sublimation-tea-coaster-a051" className={subItemLinkClass}>
                                                        Sublimation Tea Coaster
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/sublimation-fridge-magnet-a052" className={subItemLinkClass}>
                                                        Personalized Fridge Magnet
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>

                                {/* Column 2: Photo Plaques & Merchandise (Top 10 + Shop all) */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50 flex items-center justify-between">
                                        <span>Plaques &amp; Merchandise</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">21 items</span>
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/sublimation-mouse-pad-a081" className={subItemLinkClass}>
                                                        Custom Sublimation Mouse Pad
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/mdf-mobile-phone-stand-a084" className={subItemLinkClass}>
                                                        MDF Mobile Phone Stand
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/led-photo-frame-01-led-01" className={subItemLinkClass}>
                                                        LED Desk Frame LED-01
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/puzzle-frame-tf-241" className={subItemLinkClass}>
                                                        Puzzle Photo Frame TF-241
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/pin-badge-a082" className={subItemLinkClass}>
                                                        Custom Button Pin Badge
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/hard-board-photo-design-013-ac-hb-013" className={subItemLinkClass}>
                                                        Hard Board Photo Plaque 013
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/hard-board-photo-design-014-ac-hb-014" className={subItemLinkClass}>
                                                        Hard Board Photo Plaque 014
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/hard-board-photo-design-015-ac-hb-015" className={subItemLinkClass}>
                                                        Hard Board Photo Plaque 015
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/hard-board-photo-design-016-ac-hb-016" className={subItemLinkClass}>
                                                        Hard Board Photo Plaque 016
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/hard-board-photo-design-017-ac-hb-017" className={subItemLinkClass}>
                                                        Hard Board Photo Plaque 017
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li className="pt-0.5">
                                            <NavigationMenuLink
                                                render={
                                                    <a
                                                        href="/products?category=mdf-gifts"
                                                        className="block select-none rounded-lg px-2.5 py-1 text-xs font-semibold leading-normal text-primary hover:underline"
                                                    >
                                                        Shop all plaques &amp; gifts &rarr;
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>

                                {/* Bottom Bar: Direct Catalog Link */}
                                <div className="col-span-2 pt-2.5 mt-1 border-t border-border/50 flex items-center justify-between text-xs px-2.5">
                                    <span className="text-muted-foreground font-mono text-[11px]">
                                        30 Total Custom MDF &amp; Personal Gifts
                                    </span>
                                    <a
                                        href="/products?category=mdf-gifts"
                                        className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        Shop all MDF gifts &rarr;
                                    </a>
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                {/* 6. Apparel & Bags Dropdown (6 items: Custom Tees & Bags) */}
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={navItemClassName}>
                        Apparel &amp; Bags
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[440px] sm:w-[520px] p-3.5">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Column 1: Custom T-Shirts (5 items) */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50 flex items-center justify-between">
                                        <span>Custom T-Shirts</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">5 items</span>
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/black-t-shirt-a085" className={subItemLinkClass}>
                                                        Black Cotton Round Neck Tee
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/white-t-shirt-a086" className={subItemLinkClass}>
                                                        White Bio-Wash Regular Tee
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/white-t-shirt-a087" className={subItemLinkClass}>
                                                        White Graphic Heavyweight Tee
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/white-collar-t-shirt-a088" className={subItemLinkClass}>
                                                        White Collar Polo T-Shirt
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/black-collar-t-shirt-a089" className={subItemLinkClass}>
                                                        Black Collar Polo T-Shirt
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>

                                {/* Column 2: Custom Bags (1 item + expansion ready) */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50 flex items-center justify-between">
                                        <span>Custom Bags</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">1 item</span>
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/blended-plush-tote-bag-a090" className={subItemLinkClass}>
                                                        Blended Plush Canvas Tote Bag
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li className="pt-2">
                                            <NavigationMenuLink
                                                render={
                                                    <a
                                                        href="/bulk-order"
                                                        className="block select-none rounded-lg p-2 text-xs bg-muted/50 border border-border/50 hover:bg-muted"
                                                    >
                                                        <span className="font-semibold text-foreground block">Need Custom Bags in Bulk?</span>
                                                        <span className="text-[11px] text-muted-foreground">Order 40+ units with logo print &rarr;</span>
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>

                                {/* Bottom Bar: Direct Catalog Link */}
                                <div className="col-span-2 pt-2.5 mt-1 border-t border-border/50 flex items-center justify-between text-xs px-2.5">
                                    <span className="text-muted-foreground font-mono text-[11px]">
                                        Custom Bio-Washed Apparel &amp; Bags
                                    </span>
                                    <a
                                        href="/products?category=clothing"
                                        className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        Shop all apparel &rarr;
                                    </a>
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                {/* 7. All Products Quick Link */}
                <NavigationMenuItem>
                    <NavigationMenuLink
                        className={navItemClassName}
                        render={<a href="/products">All Products</a>}
                    />
                </NavigationMenuItem>

                {/* 8. Bulk Orders Direct Link */}
                <NavigationMenuItem>
                    <NavigationMenuLink
                        render={
                            <a
                                href="/bulk-order"
                                className={cn(
                                    navItemClassName,
                                    "font-semibold text-primary hover:text-primary flex items-center gap-1"
                                )}
                            >
                                <span>Bulk Orders</span>
                                <span className="rounded-full bg-primary/15 text-primary text-[10px] px-1.5 py-0.2 font-mono">Min 40</span>
                            </a>
                        }
                    />
                </NavigationMenuItem>

                {/* 9. Help Center Dropdown */}
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={navItemClassName}>
                        Help Center
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[320px] sm:w-[380px] p-2">
                            <ul className="grid grid-cols-2 gap-1">
                                <li>
                                    <NavigationMenuLink
                                        render={
                                            <a href="/bulk-order" className="block select-none rounded-lg p-2.5 text-sm font-semibold leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted text-primary">
                                                Bulk Orders
                                            </a>
                                        }
                                    />
                                </li>
                                <li>
                                    <NavigationMenuLink
                                        render={
                                            <a href="/about" className="block select-none rounded-lg p-2.5 text-sm font-medium leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted">
                                                About Us
                                            </a>
                                        }
                                    />
                                </li>
                                <li>
                                    <NavigationMenuLink
                                        render={
                                            <a href="/contact" className="block select-none rounded-lg p-2.5 text-sm font-medium leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted">
                                                Contact Us
                                            </a>
                                        }
                                    />
                                </li>
                                <li>
                                    <NavigationMenuLink
                                        render={
                                            <a href="/terms-and-conditions" className="block select-none rounded-lg p-2.5 text-sm font-medium leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted">
                                                Terms &amp; Conditions
                                            </a>
                                        }
                                    />
                                </li>
                                <li>
                                    <NavigationMenuLink
                                        render={
                                            <a href="/privacy-policy" className="block select-none rounded-lg p-2.5 text-sm font-medium leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted">
                                                Privacy Policy
                                            </a>
                                        }
                                    />
                                </li>
                                <li>
                                    <NavigationMenuLink
                                        render={
                                            <a href="/shipping-and-refund-policy" className="block select-none rounded-lg p-2.5 text-sm font-medium leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted">
                                                Shipping &amp; Refund
                                            </a>
                                        }
                                    />
                                </li>
                                <li>
                                    <NavigationMenuLink
                                        render={
                                            <a href="/faq" className="block select-none rounded-lg p-2.5 text-sm font-medium leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted">
                                                FAQs
                                            </a>
                                        }
                                    />
                                </li>
                            </ul>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}