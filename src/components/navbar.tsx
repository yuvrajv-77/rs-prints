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

    const linkCardClass = "group flex flex-col w-full h-full select-none rounded-xl p-2.5 no-underline outline-none transition-all duration-200 hover:bg-muted/80 focus:bg-muted/80 "

    const subItemLinkClass = "block select-none rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium leading-normal no-underline outline-none transition-colors hover:bg-muted hover:text-foreground text-foreground/90"

    return (
        <NavigationMenu>
            <NavigationMenuList className="gap-0.5 md:gap-1 flex-wrap">
                {/* 1. T-Shirts Dropdown (2-column: Custom T-Shirts & Custom Polo T-Shirts) */}
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={navItemClassName}>
                        T-Shirts
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[440px] sm:w-[540px] p-3.5">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Column 1: Custom T-Shirts */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50">
                                        Custom T-Shirts
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/mens-t-shirts" className={subItemLinkClass}>
                                                        Men’s T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/polyester-t-shirts" className={subItemLinkClass}>
                                                        Polyester T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/premium-mens-cotton-t-shirts" className={subItemLinkClass}>
                                                        Premium Men's Cotton T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/womens-t-shirts" className={subItemLinkClass}>
                                                        Women's T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/full-sleeves-t-shirts" className={subItemLinkClass}>
                                                        Full Sleeves T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/limited-edition-cotton-t-shirts" className={subItemLinkClass}>
                                                        Limited Edition Cotton T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/jack-and-jones-printed-tshirt" className={subItemLinkClass}>
                                                        Jack and Jones® Printed T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/kids-t-shirts" className={subItemLinkClass}>
                                                        Kid's T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>

                                {/* Column 2: Custom Polo T-Shirts */}
                                <div>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pb-2 mb-1 border-b border-border/50">
                                        Custom Polo T-Shirts
                                    </div>
                                    <ul className="flex flex-col gap-0.5">
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/mens-polo-shirts" className={subItemLinkClass}>
                                                        Men's Polo T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/premium-polo-t-shirts" className={subItemLinkClass}>
                                                        Premium Polo T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/mens-scott-polo-t-shirts" className={subItemLinkClass}>
                                                        Men's Scott Polo T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/puma-polo-t-shirts" className={subItemLinkClass}>
                                                        Puma® Polo T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/womens-polo-shirts" className={subItemLinkClass}>
                                                        Women’s Polo T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                        <li>
                                            <NavigationMenuLink
                                                render={
                                                    <a href="/products/t-shirts/womens-scott-polo-t-shirts" className={subItemLinkClass}>
                                                        Women's Scott Polo T-Shirts
                                                    </a>
                                                }
                                            />
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                {/* 2. Mobile Cases */}
                <NavigationMenuItem>
                    <NavigationMenuLink
                        className={navItemClassName}
                        render={<a href="/products/mobile-case">Mobile Cases</a>}
                    />
                </NavigationMenuItem>

               

                {/* 4. Photo Frames Dropdown (2-column layout with tall card on right) */}
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={navItemClassName}>
                        Photo Frames
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[360px] sm:w-[500px] p-3">
                            <ul className="grid grid-cols-2 grid-rows-2 gap-3">
                                {/* First Item: Takes 1 Column, spans 2 Rows */}
                                <li className="col-start-1 row-start-1 row-span-2 flex">
                                    <NavigationMenuLink
                                        render={
                                            <a href="/products/photo-frame" className={linkCardClass}>
                                                <div className="relative aspect-4/3 sm:aspect-square w-full overflow-hidden rounded-lg bg-muted mb-2">
                                                    <img
                                                        src="https://littlemoments.co.in/cdn/shop/files/6x8PhotoFramewithPhoto.jpg?v=1775057412"
                                                        alt="Photo Frames"
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                                                        Photo Frames
                                                    </span>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                                        High-definition personalized wall and tabletop photo frames.
                                                    </p>
                                                </div>
                                            </a>
                                        }
                                    />
                                </li>

                                {/* Second Item: Column 2, Row 1 */}
                                <li className="col-start-2 row-start-1 flex">
                                    <NavigationMenuLink
                                        render={
                                            <a href="/products/photo-frame-clock" className={linkCardClass}>
                                                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted mb-2">
                                                    <img
                                                        src="https://littlemoments.co.in/cdn/shop/files/6x8PhotoFramewithPhoto.jpg?v=1775057412"
                                                        alt="Photo Frame Clocks"
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                                                        Photo Frame Clocks
                                                    </span>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                                        Unique combination of wall clock and personalized photo collage.
                                                    </p>
                                                </div>
                                            </a>
                                        }
                                    />
                                </li>

                                {/* Third Item: Column 2, Row 2 */}
                                <li className="col-start-2 row-start-2 flex">
                                    <NavigationMenuLink
                                        render={
                                            <a href="/products/photo-frame-clock" className={linkCardClass}>
                                                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted mb-2">
                                                    <img
                                                        src="https://littlemoments.co.in/cdn/shop/files/6x8PhotoFramewithPhoto.jpg?v=1775057412"
                                                        alt="Collage Frames"
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                                                        Collage Frames
                                                    </span>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                                        Multi-photo artistic frames for cherished memories.
                                                    </p>
                                                </div>
                                            </a>
                                        }
                                    />
                                </li>
                            </ul>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                {/* 5. Cushion Covers */}
                <NavigationMenuItem>
                    <NavigationMenuLink
                        className={navItemClassName}
                        render={<a href="/products/cushion-cover">Cushion Covers</a>}
                    />
                </NavigationMenuItem>

                {/* 7. Water Bottles */}
                <NavigationMenuItem>
                    <NavigationMenuLink
                        className={navItemClassName}
                        render={<a href="/products/water-bottle">Water Bottles</a>}
                    />
                </NavigationMenuItem>

                {/* 8. Caps */}
                <NavigationMenuItem>
                    <NavigationMenuLink
                        className={navItemClassName}
                        render={<a href="/products/cap">Caps</a>}
                    />
                </NavigationMenuItem>

                {/* 9. Accessories */}
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={navItemClassName}>
                        Accessories
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[320px]  p-2">
                            <ul className="grid grid-cols-1 gap-1">
                                <li>
                                    <NavigationMenuLink
                                        render={
                                            <a href="/products/pens" className="block select-none rounded-lg p-2.5 text-sm font-medium leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted">
                                                Pens
                                            </a>
                                        }
                                    />
                                </li>
                                <li>
                                    <NavigationMenuLink
                                        render={
                                            <a href="/products/keychains" className="block select-none rounded-lg p-2.5 text-sm font-medium leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted">
                                                Keychains
                                            </a>
                                        }
                                    />
                                </li>
                                <li>
                                    <NavigationMenuLink
                                        render={
                                            <a href="/products/desk-mats" className="block select-none rounded-lg p-2.5 text-sm font-medium leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted">
                                                Desk Mats
                                            </a>
                                        }
                                    />
                                </li>
                            </ul>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                {/* 10. Banners */}
                <NavigationMenuItem>
                    <NavigationMenuLink
                        className={navItemClassName}
                        render={<a href="/products/banner">Banners</a>}
                    />
                </NavigationMenuItem>

                {/* 11. Happy Customers */}
                <NavigationMenuItem>
                    <NavigationMenuLink
                        className={navItemClassName}
                        render={<a href="/reviews">Happy Customers</a>}
                    />
                </NavigationMenuItem>

                {/* 12. Help Center Dropdown */}
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
                                                Terms & Conditions
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
                                                Shipping & Refund
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