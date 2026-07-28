'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createElement, useState, useEffect, useRef } from 'react'
import {
  ShoppingBag,
  Search,
  User,
  Menu,
  X,
  ChevronDown,
  Globe,
  Heart,
  MapPin,
  DollarSign,
  ChevronRight,
  Zap,
  Star,
  Tag,
  Sparkles,
  LayoutGrid,
  Shirt,
  Watch,
  Smartphone,
  Home,
  Flower2,
  Building2,
  Package,
  Headphones,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useCart } from '@/components/cart-provider'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Types ─────────────────────────────────────────────────────── */
interface MegaColumn {
  heading: string
  icon: LucideIcon
  links: { label: string; href: string; badge?: string }[]
}

interface NavItem {
  label: string
  href: string
  icon?: React.ElementType
  highlight?: boolean
  mega?: MegaColumn[]
}

/* ─── Nav Data ───────────────────────────────────────────────────── */
const NAV_ITEMS: NavItem[] = [
  {
    label: 'All Categories',
    href: '/products',
    icon: LayoutGrid,
    mega: [
      {
        heading: 'Fashion',
        icon: Shirt,
        links: [
          { label: 'Men', href: '/products?cat=men' },
          { label: 'Women', href: '/products?cat=women' },
          { label: 'Korean Fashion', href: '/products?cat=korean-fashion', badge: 'Trend' },
          { label: 'Footwear', href: '/products?cat=footwear' },
          { label: 'Sneakers', href: '/products?cat=sneakers' },
        ],
      },
      {
        heading: 'Luxury',
        icon: Watch,
        links: [
          { label: 'Luxury Watches', href: '/products?cat=watches' },
          { label: 'Accessories', href: '/products?cat=accessories' },
          { label: 'Bags & Leather', href: '/products?cat=bags' },
          { label: 'Jewellery', href: '/products?cat=jewellery' },
          { label: 'Sunglasses', href: '/products?cat=sunglasses' },
        ],
      },
      {
        heading: 'Electronics',
        icon: Smartphone,
        links: [
          { label: 'Smartphones', href: '/products?cat=smartphones' },
          { label: 'Gaming', href: '/products?cat=gaming', badge: 'Hot' },
          { label: 'Laptops', href: '/products?cat=laptops' },
          { label: 'Audio', href: '/products?cat=audio' },
          { label: 'Wearables', href: '/products?cat=wearables' },
        ],
      },
      {
        heading: 'Lifestyle',
        icon: Home,
        links: [
          { label: 'Home & Living', href: '/products?cat=home' },
          { label: 'Furniture', href: '/products?cat=furniture' },
          { label: 'Beauty', href: '/products?cat=beauty' },
          { label: 'Sports', href: '/products?cat=sports' },
          { label: 'Automotive', href: '/products?cat=automotive' },
        ],
      },
      {
        heading: 'More',
        icon: Package,
        links: [
          { label: 'Books', href: '/products?cat=books' },
          { label: 'Toys & Games', href: '/products?cat=toys' },
          { label: 'Worldwide Brands', href: '/products?cat=brands' },
          { label: 'Customer Support', href: 'mailto:hello@worldwideshopio.com' },
        ],
      },
    ],
  },
  {
    label: 'Fresh',
    href: '/products?filter=fresh',
    icon: Sparkles,
    highlight: true,
  },
  {
    label: 'New Arrivals',
    href: '/products?badge=New',
    icon: Zap,
    mega: [
      {
        heading: 'Just Landed',
        icon: Zap,
        links: [
          { label: 'New in Fashion', href: '/products?cat=fashion&badge=New', badge: 'New' },
          {
            label: 'New in Electronics',
            href: '/products?cat=electronics&badge=New',
            badge: 'New',
          },
          { label: 'New in Beauty', href: '/products?cat=beauty&badge=New' },
          { label: 'New in Home', href: '/products?cat=home&badge=New' },
          { label: 'View All New Arrivals', href: '/products?badge=New' },
        ],
      },
      {
        heading: 'Trending Now',
        icon: Star,
        links: [
          { label: 'Korean Fashion', href: '/products?cat=korean-fashion', badge: 'Trend' },
          { label: 'Y2K Aesthetic', href: '/products?style=y2k' },
          { label: 'Minimalist', href: '/products?style=minimal' },
          { label: 'Streetwear', href: '/products?style=street' },
          { label: 'View All Trends', href: '/products?filter=trending' },
        ],
      },
    ],
  },
  {
    label: 'Trending',
    href: '/products?filter=trending',
    mega: [
      {
        heading: 'Most Popular',
        icon: Star,
        links: [
          { label: 'Trending Fashion', href: '/products?cat=fashion&filter=trending' },
          {
            label: 'Trending Sneakers',
            href: '/products?cat=sneakers&filter=trending',
            badge: 'Hot',
          },
          { label: 'Trending Watches', href: '/products?cat=watches&filter=trending' },
          { label: 'Trending Electronics', href: '/products?cat=electronics&filter=trending' },
        ],
      },
      {
        heading: 'By Style',
        icon: Shirt,
        links: [
          { label: 'Streetwear', href: '/products?style=street' },
          { label: 'Minimalist', href: '/products?style=minimal' },
          { label: 'Korean Fashion', href: '/products?cat=korean-fashion' },
          { label: 'Luxury Casual', href: '/products?style=luxury-casual' },
        ],
      },
    ],
  },
  {
    label: 'Best Sellers',
    href: '/products?filter=bestsellers',
    mega: [
      {
        heading: 'Top Picks',
        icon: Star,
        links: [
          { label: 'Top 50 Products', href: '/products?filter=top50' },
          { label: 'Best in Fashion', href: '/products?cat=fashion&filter=bestsellers' },
          { label: 'Best in Electronics', href: '/products?cat=electronics&filter=bestsellers' },
          { label: 'Best in Beauty', href: '/products?cat=beauty&filter=bestsellers' },
          { label: 'Staff Picks', href: '/products?filter=staff' },
        ],
      },
    ],
  },
  {
    label: "Today's Deals",
    href: '/products?filter=deals',
    icon: Tag,
    highlight: true,
    mega: [
      {
        heading: 'Limited Offers',
        icon: Tag,
        links: [
          { label: 'Flash Sales', href: '/products?filter=flash', badge: 'LIVE' },
          { label: 'Budget Finds', href: '/products?maxprice=50' },
          { label: 'Premium Picks', href: '/products?maxprice=100' },
          { label: 'Clearance', href: '/products?filter=clearance' },
          { label: 'Bundle Deals', href: '/products?filter=bundle' },
        ],
      },
      {
        heading: 'By Category',
        icon: LayoutGrid,
        links: [
          { label: 'Fashion Deals', href: '/products?cat=fashion&filter=deals' },
          { label: 'Electronics Deals', href: '/products?cat=electronics&filter=deals' },
          { label: 'Luxury Deals', href: '/products?cat=luxury&filter=deals' },
          { label: 'Beauty Deals', href: '/products?cat=beauty&filter=deals' },
        ],
      },
    ],
  },
  {
    label: 'Fashion',
    href: '/products?cat=fashion',
    icon: Shirt,
    mega: [
      {
        heading: 'Men',
        icon: Shirt,
        links: [
          { label: "All Men's", href: '/products?cat=men' },
          { label: 'T-Shirts & Tops', href: '/products?cat=men&sub=tops' },
          { label: 'Jackets & Coats', href: '/products?cat=men&sub=jackets' },
          { label: 'Trousers', href: '/products?cat=men&sub=trousers' },
          { label: 'Sneakers', href: '/products?cat=men&sub=sneakers' },
        ],
      },
      {
        heading: 'Women',
        icon: Flower2,
        links: [
          { label: "All Women's", href: '/products?cat=women' },
          { label: 'Dresses', href: '/products?cat=women&sub=dresses' },
          { label: 'Korean Fashion', href: '/products?cat=korean-fashion', badge: 'Trend' },
          { label: 'Bags & Purses', href: '/products?cat=women&sub=bags' },
          { label: 'Heels & Boots', href: '/products?cat=women&sub=heels' },
        ],
      },
      {
        heading: 'Accessories',
        icon: Watch,
        links: [
          { label: 'Luxury Watches', href: '/products?cat=watches' },
          { label: 'Sunglasses', href: '/products?cat=sunglasses' },
          { label: 'Jewellery', href: '/products?cat=jewellery' },
          { label: 'Hats & Caps', href: '/products?cat=hats' },
          { label: 'Belts & Wallets', href: '/products?cat=belts' },
        ],
      },
    ],
  },
  {
    label: 'Electronics',
    href: '/products?cat=electronics',
    icon: Smartphone,
    mega: [
      {
        heading: 'Devices',
        icon: Smartphone,
        links: [
          { label: 'Smartphones', href: '/products?cat=smartphones' },
          { label: 'Laptops', href: '/products?cat=laptops' },
          { label: 'Tablets', href: '/products?cat=tablets' },
          { label: 'Wearables', href: '/products?cat=wearables' },
          { label: 'Cameras', href: '/products?cat=cameras' },
        ],
      },
      {
        heading: 'Entertainment',
        icon: Headphones,
        links: [
          { label: 'Gaming', href: '/products?cat=gaming', badge: 'Hot' },
          { label: 'Audio & Headphones', href: '/products?cat=audio' },
          { label: 'Smart Home', href: '/products?cat=smarthome' },
          { label: 'TV & Displays', href: '/products?cat=tv' },
        ],
      },
    ],
  },
  {
    label: 'Brands',
    href: '/products?filter=brands',
    icon: Building2,
  },
]

/* ─── Country / Currency data ────────────────────────────────────── */
const COUNTRIES = [
  'Global',
  'United States',
  'United Kingdom',
  'South Korea',
  'Japan',
  'UAE',
  'Germany',
  'France',
]
const CURRENCIES = ['USD', 'GBP', 'KRW', 'JPY', 'AED', 'EUR']

/* ─── Animated underline link ─────────────────────────────────────── */
function NavLink({
  label,
  href,
  icon: Icon,
  highlight,
  active,
  onEnter,
  onLeave,
}: {
  label: string
  href: string
  icon?: React.ElementType
  highlight?: boolean
  active: boolean
  onEnter: () => void
  onLeave: () => void
}) {
  return (
    <Link
      href={href}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`relative flex items-center gap-1.5 text-sm font-medium tracking-wide transition-colors duration-200 whitespace-nowrap
        ${highlight ? 'text-primary' : active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {Icon && createElement(Icon, { className: 'h-3.5 w-3.5 shrink-0' })}
      {label}
      {/* Animated underline */}
      <motion.span
        className="absolute -bottom-[1px] left-0 h-[2px] bg-primary rounded-full"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: active ? 1 : 0, opacity: active ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'left' }}
      />
    </Link>
  )
}

/* ─── Mega Menu Panel ─────────────────────────────────────────────── */
function MegaMenu({ columns }: { columns: MegaColumn[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50"
      style={{ minWidth: `${Math.min(columns.length, 5) * 180}px` }}
    >
      {/* Gold top border accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-lg" />
      <div className="glass-strong rounded-b-xl shadow-2xl shadow-black/60 overflow-hidden">
        <div
          className="grid gap-0 divide-x divide-white/5"
          style={{
            gridTemplateColumns: `repeat(${Math.min(columns.length, 5)}, minmax(160px, 1fr))`,
          }}
        >
          {columns.map((col) => {
            const ColIcon = col.icon
            return (
              <div key={col.heading} className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ColIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold tracking-widest uppercase text-primary">
                    {col.heading}
                  </span>
                </div>
                <ul className="space-y-1">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group flex items-center justify-between gap-2 py-1.5 px-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/6 transition-all duration-150"
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                          {link.label}
                        </span>
                        {link.badge ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 leading-none">
                            {link.badge}
                          </span>
                        ) : (
                          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Search Overlay ─────────────────────────────────────────────── */
function SearchOverlay({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [term, setTerm] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const submit = (value: string) => {
    const q = value.trim()
    if (!q) return
    onClose()
    router.push(`/products?q=${encodeURIComponent(q)}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex flex-col"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <div
        className="relative z-10 w-full border-b border-white/10 bg-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto max-w-3xl px-4 py-6 flex items-center gap-4">
          <Search className="h-5 w-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return
              if (e.key === 'Enter') submit(term)
              if (e.key === 'Escape') onClose()
            }}
            placeholder="Search products, brands, categories…"
            aria-label="Search products"
            className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-4 flex flex-wrap gap-2">
          {['Luxury Watches', 'Korean Fashion', 'Sneakers', 'Smartphones', "Today's Deals"].map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/6 text-muted-foreground hover:text-foreground hover:bg-white/10 cursor-pointer transition-all border border-white/8"
              >
                {s}
              </button>
            ),
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Country / Currency picker ──────────────────────────────────── */
function SelectorDropdown({
  trigger,
  options,
  value,
  onChange,
}: {
  trigger: React.ReactNode
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {trigger}
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-36 glass-strong rounded-xl shadow-2xl py-1.5 z-50"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/6 ${
                  value === opt
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Main Navbar ─────────────────────────────────────────────────── */
interface NavbarProps {
  cartCount?: number
  wishlistCount?: number
  isLoggedIn?: boolean
  isAdmin?: boolean
}

export function Navbar({
  cartCount,
  wishlistCount = 0,
  isLoggedIn = false,
  isAdmin = false,
}: NavbarProps) {
  const { count: contextCartCount } = useCart()
  const cartBadge = cartCount ?? contextCartCount
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [country, setCountry] = useState('Global')
  const [currency, setCurrency] = useState('USD')
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleEnter = (label: string) => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setActiveMenu(label)
  }
  const handleLeave = () => {
    hideTimer.current = setTimeout(() => setActiveMenu(null), 120)
  }
  const cancelHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }

  return (
    <>
      <AnimatePresence>
        {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={`sticky top-0 z-40 w-full transition-all duration-500 ${
          scrolled
            ? 'glass-strong shadow-2xl shadow-black/50'
            : 'bg-black/90 backdrop-blur-md border-b border-white/5'
        }`}
      >
        {/* ── Utility bar ─────────────────────────────────────────── */}
        <div className="hidden md:block border-b border-white/5 bg-black/40">
          <div className="mx-auto max-w-[1400px] px-6 h-8 flex items-center justify-between">
            {/* Left: announcement */}
            <p className="text-[11px] tracking-widest text-muted-foreground uppercase">
              Worldwide Shipping &nbsp;·&nbsp; Free Returns on Qualifying Orders &nbsp;·&nbsp;
              Authenticity Guaranteed
            </p>
            {/* Right: country + currency */}
            <div className="flex items-center gap-4">
              <SelectorDropdown
                trigger={
                  <>
                    <MapPin className="h-3 w-3" />
                    <span>{country}</span>
                  </>
                }
                options={COUNTRIES}
                value={country}
                onChange={setCountry}
              />
              <SelectorDropdown
                trigger={
                  <>
                    <DollarSign className="h-3 w-3" />
                    <span>{currency}</span>
                  </>
                }
                options={CURRENCIES}
                value={currency}
                onChange={setCurrency}
              />
            </div>
          </div>
        </div>

        {/* ── Main nav row ─────────────────────────────────────────── */}
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 flex h-[60px] items-center gap-6 md:gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0 mr-2">
            <Globe className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-12" />
            <span className="font-serif text-base font-bold tracking-[0.18em] uppercase text-shimmer leading-none">
              Worldwide Shopio
            </span>
          </Link>

          {/* Desktop: nav links */}
          <nav className="hidden xl:flex items-center gap-5 flex-1 min-w-0">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="relative py-[20px]"
                onMouseEnter={() => handleEnter(item.label)}
                onMouseLeave={handleLeave}
              >
                <NavLink
                  label={item.label}
                  href={item.href}
                  icon={item.icon}
                  highlight={item.highlight}
                  active={activeMenu === item.label}
                  onEnter={() => handleEnter(item.label)}
                  onLeave={handleLeave}
                />
                <AnimatePresence>
                  {item.mega && activeMenu === item.label && (
                    <div onMouseEnter={cancelHide} onMouseLeave={handleLeave}>
                      <MegaMenu columns={item.mega} />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Medium screens: fewer nav links */}
          <nav className="hidden md:flex xl:hidden items-center gap-5 flex-1 overflow-x-auto scrollbar-hide">
            {NAV_ITEMS.slice(0, 6).map((item) => (
              <div
                key={item.label}
                className="relative py-[20px]"
                onMouseEnter={() => handleEnter(item.label)}
                onMouseLeave={handleLeave}
              >
                <NavLink
                  label={item.label}
                  href={item.href}
                  icon={item.icon}
                  highlight={item.highlight}
                  active={activeMenu === item.label}
                  onEnter={() => handleEnter(item.label)}
                  onLeave={handleLeave}
                />
                <AnimatePresence>
                  {item.mega && activeMenu === item.label && (
                    <div onMouseEnter={cancelHide} onMouseLeave={handleLeave}>
                      <MegaMenu columns={item.mega} />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 text-muted-foreground hover:text-foreground transition-all duration-200 text-sm"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs hidden lg:block">Search…</span>
            </button>

            {/* Wishlist */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="relative text-muted-foreground hover:text-foreground hover:bg-white/5 hidden md:inline-flex"
            >
              <Link href="/dashboard">
                <Heart className="h-4.5 w-4.5" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-0">
                    {wishlistCount}
                  </Badge>
                )}
                <span className="sr-only">Wishlist</span>
              </Link>
            </Button>

            {/* User */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-muted-foreground hover:text-foreground hover:bg-white/5 hidden md:inline-flex"
            >
              <Link href={isLoggedIn ? (isAdmin ? '/admin' : '/dashboard') : '/login'}>
                <User className="h-4.5 w-4.5" />
                <span className="sr-only">Account</span>
              </Link>
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="relative text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <Link href="/cart">
                <ShoppingBag className="h-4.5 w-4.5" />
                {cartBadge > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-0">
                    {cartBadge}
                  </Badge>
                )}
                <span className="sr-only">Cart{cartBadge > 0 ? ` (${cartBadge} items)` : ''}</span>
              </Link>
            </Button>

            {/* Mobile search */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4.5 w-4.5" />
            </Button>

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-muted-foreground hover:text-foreground"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[300px] bg-background border-white/10 flex flex-col gap-0 p-0"
              >
                {/* Mobile header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-serif text-sm font-bold tracking-widest uppercase text-shimmer">
                      Worldwide Shopio
                    </span>
                  </div>
                  <button onClick={() => setMobileOpen(false)}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </div>
                {/* Mobile search */}
                <div className="px-4 py-3 border-b border-white/8">
                  <div className="flex items-center gap-2 bg-white/6 border border-white/10 rounded-lg px-3 py-2">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      placeholder="Search…"
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>
                </div>
                {/* Mobile nav items */}
                <nav className="flex-1 overflow-y-auto py-2">
                  {NAV_ITEMS.map((item) => {
                    const ItemIcon = item.icon
                    const isExpanded = mobileExpanded === item.label
                    return (
                      <div key={item.label} className="border-b border-white/5 last:border-0">
                        <button
                          onClick={() => {
                            if (item.mega) {
                              setMobileExpanded(isExpanded ? null : item.label)
                            } else {
                              setMobileOpen(false)
                            }
                          }}
                          className={`w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium transition-colors ${
                            item.highlight ? 'text-primary' : 'text-foreground hover:text-primary'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {ItemIcon &&
                              createElement(ItemIcon, {
                                className: 'h-4 w-4 shrink-0 text-muted-foreground',
                              })}
                            {item.mega ? (
                              <span>{item.label}</span>
                            ) : (
                              <Link
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="block"
                              >
                                {item.label}
                              </Link>
                            )}
                          </div>
                          {item.mega && (
                            <ChevronDown
                              className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          )}
                        </button>
                        <AnimatePresence>
                          {item.mega && isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden bg-white/3"
                            >
                              {item.mega.map((col) => (
                                <div key={col.heading} className="px-5 py-3">
                                  <p className="text-[10px] font-semibold tracking-widest uppercase text-primary mb-2">
                                    {col.heading}
                                  </p>
                                  {col.links.map((link) => (
                                    <Link
                                      key={link.label}
                                      href={link.href}
                                      onClick={() => setMobileOpen(false)}
                                      className="flex items-center justify-between py-1.5 pl-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      {link.label}
                                      {link.badge && (
                                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                                          {link.badge}
                                        </span>
                                      )}
                                    </Link>
                                  ))}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </nav>
                {/* Mobile footer actions */}
                <div className="border-t border-white/8 p-4 flex flex-col gap-2">
                  <Button
                    asChild
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  >
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Sign In / Register
                    </Link>
                  </Button>
                  <div className="flex items-center justify-center gap-4 pt-1">
                    <SelectorDropdown
                      trigger={
                        <>
                          <MapPin className="h-3 w-3" />
                          <span>{country}</span>
                        </>
                      }
                      options={COUNTRIES}
                      value={country}
                      onChange={setCountry}
                    />
                    <SelectorDropdown
                      trigger={
                        <>
                          <DollarSign className="h-3 w-3" />
                          <span>{currency}</span>
                        </>
                      }
                      options={CURRENCIES}
                      value={currency}
                      onChange={setCurrency}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>
    </>
  )
}
