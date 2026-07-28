'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef } from 'react'
import {
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  Play,
  Shield,
  RefreshCw,
  Truck,
  HeadphonesIcon,
  Globe,
  Sparkles,
  ShoppingCart,
  Heart,
  CheckCircle2,
} from 'lucide-react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { DualPrice } from '@/components/dual-price'
import { CinematicHeroVisual } from '@/components/cinematic-hero-visual'
import type { Product } from '@/lib/store'

/* ─── FadeUp helper ─────────────────────────────────────────────── */
function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Section heading helper ─────────────────────────────────────── */
function SectionHeading({
  eyebrow,
  title,
  center = false,
}: {
  eyebrow: string
  title: React.ReactNode
  center?: boolean
}) {
  return (
    <div className={center ? 'text-center' : ''}>
      <div className={`flex items-center gap-2 mb-3 ${center ? 'justify-center' : ''}`}>
        <span className="h-px w-6 bg-primary" />
        <span className="text-xs tracking-[0.25em] uppercase text-primary font-medium">
          {eyebrow}
        </span>
        {center && <span className="h-px w-6 bg-primary" />}
      </div>
      <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground text-balance">
        {title}
      </h2>
    </div>
  )
}

/* ─── Data ───────────────────────────────────────────────────────── */
const CATEGORY_NAV = [
  'All Categories',
  'New Arrivals',
  'Trending',
  'Best Sellers',
  'Fashion',
  'Men',
  'Women',
  'Korean Fashion',
  'Shoes',
  'Sneakers',
  'Watches',
  'Accessories',
  'Electronics',
  'Smartphones',
  'Gaming',
  'Home & Living',
  'Furniture',
  'Beauty',
  'Automotive',
  'Sports',
  'Books',
  'Customer Support',
]

const CATEGORIES = [
  {
    label: 'Men',
    sub: 'Latest drops',
    image: '/images/category-men.png',
    href: '/products?cat=men',
  },
  {
    label: 'Women',
    sub: 'New season',
    image: '/images/category-women.png',
    href: '/products?cat=women',
  },
  {
    label: 'Accessories',
    sub: 'Curated picks',
    image: '/images/category-accessories.png',
    href: '/products?cat=accessories',
  },
  {
    label: 'New In',
    sub: 'Just arrived',
    image: '/images/category-new.png',
    href: '/products?badge=New',
  },
]

const BRANDS = [
  'GUCCI',
  'PRADA',
  'LOUIS V.',
  'HERMÈS',
  'VERSACE',
  'BALENCIAGA',
  'BURBERRY',
  'DIOR',
  'CHANEL',
  'FENDI',
  'GIVENCHY',
  'VALENTINO',
]

const TESTIMONIALS = [
  {
    name: 'Sarah K.',
    location: 'New York, USA',
    quote:
      'The leather jacket exceeded every expectation. The craftsmanship is impeccable and the packaging alone felt like a luxury experience.',
    rating: 5,
    product: 'Obsidian Leather Jacket',
    avatar: 'SK',
  },
  {
    name: 'Marcus T.',
    location: 'London, UK',
    quote:
      'Three months of daily wear and they still look brand new. Worldwide Shopio has earned a customer for life.',
    rating: 5,
    product: 'Cloud Runner Sneakers',
    avatar: 'MT',
  },
  {
    name: 'Elena R.',
    location: 'Paris, France',
    quote:
      'The tote bag is beautifully structured. The full-grain leather patinas beautifully — better every week.',
    rating: 5,
    product: 'Structured Leather Tote',
    avatar: 'ER',
  },
  {
    name: 'Hiroshi N.',
    location: 'Tokyo, Japan',
    quote:
      'Worldwide Shopio delivered to Japan in 3 days. The chronograph watch came perfectly protected. Flawless service.',
    rating: 5,
    product: 'Noir Chronograph Watch',
    avatar: 'HN',
  },
]

const STATS = [
  { value: '2.4M+', label: 'Happy Customers' },
  { value: '180+', label: 'Countries Served' },
  { value: '12K+', label: 'Luxury Products' },
  { value: '4.9★', label: 'Average Rating' },
]

const WHY_US = [
  {
    icon: Truck,
    title: 'Worldwide Shipping',
    description:
      'Fast, tracked delivery to 180+ countries with free shipping on qualifying orders.',
  },
  {
    icon: Shield,
    title: 'Trusted Brands',
    description: 'Every product is 100% authentic, verified by our luxury experts before dispatch.',
  },
  {
    icon: CheckCircle2,
    title: 'Secure Payments',
    description:
      'Bank-grade encryption on every transaction. All major cards and wallets accepted.',
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    description: '30-day hassle-free returns on all items. No questions, no complications.',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Customer Support',
    description: 'Our concierge team is available around the clock to assist with your order.',
  },
]

/* ─── Product Card ───────────────────────────────────────────────── */
function ProductCard({ product, index }: { product: Product; index: number }) {
  const [wishlisted, setWishlisted] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <FadeUp delay={index * 0.08}>
      <div className="group relative flex flex-col">
        {/* Image */}
        <Link
          href={`/products/${product.id}`}
          className="relative aspect-square overflow-hidden rounded-2xl bg-secondary block mb-4"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {/* Badge */}
          {product.badge && (
            <div className="absolute top-3 left-3 z-10">
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  product.badge === 'Sale'
                    ? 'bg-red-500/90 text-white'
                    : 'bg-primary/90 text-primary-foreground'
                }`}
              >
                {product.badge}
              </span>
            </div>
          )}
          {/* Wishlist */}
          <button
            onClick={(e) => {
              e.preventDefault()
              setWishlisted((w) => !w)
            }}
            className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full glass border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:border-primary/40"
            aria-label="Add to wishlist"
          >
            <Heart
              className={`h-3.5 w-3.5 transition-colors ${wishlisted ? 'fill-red-400 text-red-400' : 'text-muted-foreground'}`}
            />
          </button>
          {/* Quick view overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="block w-full text-center text-xs font-semibold tracking-widest uppercase glass rounded-lg py-2.5 text-foreground border-0">
              Quick View
            </span>
          </div>
        </Link>

        {/* Info */}
        <div className="flex flex-col gap-1 flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {product.category}
          </p>
          <Link href={`/products/${product.id}`}>
            <p className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </p>
          </Link>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="text-xs text-muted-foreground">
              {product.rating} ({product.reviews})
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <DualPrice usdCents={product.price * 100} className="text-sm font-bold text-primary" />
            {product.originalPrice && (
              <DualPrice
                usdCents={product.originalPrice * 100}
                className="text-xs text-muted-foreground line-through"
              />
            )}
          </div>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAdd}
          className={`mt-3 w-full flex items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase h-10 rounded-xl transition-all duration-300 border ${
            added
              ? 'bg-primary/20 border-primary/60 text-primary'
              : 'glass border-white/10 text-muted-foreground hover:border-primary/40 hover:text-foreground'
          }`}
        >
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
          {added ? 'Added!' : 'Add to Cart'}
        </button>
      </div>
    </FadeUp>
  )
}

/* ─── Page ───────────────────────────────────────────────────────── */
export function HomeClient({
  bestsellers,
  trending,
}: {
  bestsellers: Product[]
  trending: Product[]
}) {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const heroRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Navbar cartCount={0} />

      {/* ── CATEGORY NAV BAR ─────────────────────────────────────── */}
      <nav
        aria-label="Product categories"
        className="sticky top-[var(--navbar-h,72px)] z-30 bg-[oklch(0.08_0_0)] border-b border-white/6"
      >
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            {CATEGORY_NAV.map((cat, i) => (
              <Link
                key={cat}
                href={`/products?cat=${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'))}`}
                className={`shrink-0 px-4 py-3 text-xs font-medium tracking-wide whitespace-nowrap transition-colors border-b-2 -mb-px
                  ${
                    i === 0
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-white/20'
                  }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          /* Below 768px `.hero-viewport` (globals.css) makes this fill the
             first screen and grow with its content; desktop and tablet keep the
             untouched locked-viewport hero. */
          className="hero-viewport relative overflow-hidden bg-background md:h-[calc(100svh-7rem)] md:min-h-[680px]"
        >
          {/* ── HERO CANVAS ───────────────────────────────────────────────
              On desktop and tablet this simply fills the section (inset-0),
              reproducing the approved layout exactly. Below 768px
              `.hero-canvas` puts it in flow at the phone's own width.

              `@container` makes the children's breakpoints resolve against this
              canvas. Since the canvas is viewport-width at every size, that is
              equivalent to the viewport — the container form is kept because
              the mobile rules depend on `@min-[768px]` NOT matching on phones,
              which is what lets every child fall back to its readable
              unprefixed mobile class. */}
          <div className="hero-canvas @container absolute inset-0 flex items-center">
            {/* Full-bleed cinematic 3D layer. Its absolute bounds reserve space and prevent CLS. */}
            <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
              <CinematicHeroVisual />
            </motion.div>

            {/* Content */}
            <motion.div
              style={{ opacity: heroOpacity }}
              className="relative z-10 mx-auto max-w-7xl px-6 @min-[768px]:px-10 w-full pointer-events-none"
            >
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <span className="h-px w-8 bg-primary" />
                  {/* Phones get slightly tighter tracking so the eyebrow stays
                      on one line at 360px instead of breaking to "E-COMMERCE";
                      tablet and desktop keep the original 0.3em. */}
                  <span className="text-xs tracking-[0.18em] @min-[768px]:tracking-[0.3em] uppercase text-primary font-medium">
                    Global Luxury E-Commerce
                  </span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                /* The unprefixed size is the phone size (the `@min-[768px]`
                   container queries do not match there): 2.5rem keeps
                   "Finest Products" on one line at 360px and holds the headline
                   to three lines, leaving room for the artwork below. */
                className="font-serif text-[2.5rem] @min-[768px]:text-7xl @min-[1024px]:text-8xl font-bold leading-[1.05] text-balance max-w-2xl"
              >
                Discover the <span className="text-shimmer">World&apos;s</span>
                <br />
                Finest Products
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                className="mt-5 text-base @min-[768px]:text-lg text-muted-foreground max-w-md leading-relaxed"
              >
                Premium brands, global collections, secure shopping, and fast worldwide delivery.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                className="mt-8 flex flex-wrap items-center gap-4 pointer-events-auto"
              >
                <Button
                  size="lg"
                  asChild
                  /* Same size, same position — only the feedback is richer:
                     a subtle lift and deeper gold bloom on hover, and a real
                     press state. All transform-based, so no layout cost. */
                  className="cta-shine group bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-wide px-8 h-12 gold-glow transform-gpu transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_38px_oklch(0.8_0.12_80/0.4),0_0_80px_oklch(0.8_0.12_80/0.2)] active:translate-y-0 active:scale-[0.985]"
                >
                  <Link href="/products">
                    Shop Now{' '}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  asChild
                  className="border border-white/15 hover:border-primary/40 hover:bg-white/5 text-foreground h-12 px-8 transform-gpu transition-[transform,border-color,background-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-18px_oklch(0.8_0.12_80/0.45)] active:translate-y-0 active:scale-[0.985]"
                >
                  <Link href="/products">
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Explore Collections
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
                /* Phones: tighter rhythm and a 2x2 grid capped at 17rem, which
                   keeps all four labels inside the scrim's darkest region
                   instead of running out over the figure. Tablet and desktop
                   keep the original single flex row at mt-14/gap-8. */
                className="mt-8 grid max-w-[17rem] grid-cols-2 gap-x-5 gap-y-5 @min-[768px]:mt-14 @min-[768px]:flex @min-[768px]:max-w-none @min-[768px]:flex-wrap @min-[768px]:gap-8"
              >
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p className="font-serif text-2xl font-bold text-primary">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 tracking-wide">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Scroll cue */}
            <motion.div
              className="hero-scroll-cue absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-xs text-muted-foreground tracking-widest uppercase">
                Scroll
              </span>
              <div className="h-8 w-px bg-gradient-to-b from-primary/60 to-transparent" />
            </motion.div>
          </div>
        </section>

        {/* ── TRUST BAR ─────────────────────────────────────────────── */}
        <div className="border-y border-white/8 bg-[oklch(0.09_0_0)]">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-5">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              {[
                { icon: Truck, label: 'Free Worldwide Shipping', sub: 'Qualifying orders' },
                { icon: Shield, label: '100% Authenticity', sub: 'Verified luxury goods' },
                { icon: RefreshCw, label: 'Free Returns', sub: '30-day policy' },
                { icon: HeadphonesIcon, label: '24/7 Concierge', sub: 'White-glove support' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full border border-primary/30 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FEATURED CATEGORIES ──────────────────────────────────── */}
        {/* Mobile keeps a tight ~28px band; md+ (tablet and desktop) retain the
            original py-24 rhythm untouched. */}
        <section className="mx-auto max-w-7xl px-4 md:px-6 pt-7 pb-7 md:pt-24 md:pb-24">
          <FadeUp>
            <div className="flex items-end justify-between mb-7 md:mb-10">
              <SectionHeading eyebrow="Browse" title="Shop by Category" />
              <Link
                href="/products"
                className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                All Categories <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeUp>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => (
              <FadeUp key={cat.label} delay={i * 0.08}>
                <Link
                  href={cat.href}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl block"
                >
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-primary/40 transition-colors duration-300" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    <div className="glass rounded-xl px-4 py-3 inline-block">
                      <p className="font-serif text-base font-bold text-foreground">{cat.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.sub}</p>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* ── BEST SELLERS ─────────────────────────────────────────── */}
        <section className="bg-[oklch(0.08_0_0)] border-y border-white/5 py-7 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <FadeUp>
              <div className="flex items-end justify-between mb-7 md:mb-10">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <SectionHeading eyebrow="Top Picks" title="Best Sellers" />
                </div>
                <Link
                  href="/products"
                  className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </FadeUp>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {bestsellers.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── PROMO BANNER ──────────────────────────────────��──────── */}
        <section className="relative py-8 md:py-32 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/hero-banner.png"
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-background/75" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10">
            <FadeUp>
              <div className="max-w-2xl glass-strong rounded-3xl p-10 md:p-14 gold-border border">
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 tracking-widest uppercase text-xs">
                  Limited Offer
                </Badge>
                <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance">
                  End of Season Sale — Up to <span className="text-shimmer">40% Off</span>
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Our most exclusive pieces at their most accessible prices. Authenticity
                  guaranteed. Free express shipping on all sale orders.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    asChild
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 gold-glow"
                  >
                    <Link href="/products?badge=Sale">
                      Shop the Sale <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    asChild
                    className="border border-white/15 hover:border-primary/40"
                  >
                    <Link href="/products">Browse All</Link>
                  </Button>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── TRENDING PRODUCTS ────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 md:px-6 py-7 md:py-24">
          <FadeUp>
            <div className="flex items-end justify-between mb-7 md:mb-10">
              <SectionHeading eyebrow="What's Hot" title="Trending Now" />
              <Link
                href="/products"
                className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                See All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {trending.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>

        {/* ── WHY CHOOSE WORLDWIDE SHOPIO ──────────────────────────── */}
        <section className="relative py-8 md:py-28 overflow-hidden border-y border-white/5">
          <div className="absolute inset-0">
            <Image
              src="/images/why-choose-bg.png"
              alt=""
              fill
              className="object-cover opacity-40"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-background/85" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
            <FadeUp>
              <div className="text-center mb-8 md:mb-14">
                <SectionHeading
                  eyebrow="Our Promise"
                  title={
                    <>
                      Why Choose <span className="text-shimmer">Worldwide Shopio</span>
                    </>
                  }
                  center
                />
                <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  We&apos;re not just a store — we&apos;re a commitment to quality, authenticity,
                  and an exceptional shopping experience from click to doorstep.
                </p>
              </div>
            </FadeUp>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {WHY_US.map((item, i) => (
                <FadeUp key={item.title} delay={i * 0.08}>
                  <div className="glass-strong rounded-2xl p-6 text-center flex flex-col items-center gap-4 h-full hover:border-primary/30 border border-white/8 transition-all duration-300 group">
                    <div className="h-12 w-12 rounded-2xl border border-primary/30 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm mb-2">{item.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── LUXURY BRANDS ────────────────────────────────────────── */}
        <section className="border-b border-white/5 py-7 md:py-16 bg-[oklch(0.08_0_0)]">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <FadeUp>
              <div className="text-center mb-7 md:mb-10">
                <SectionHeading eyebrow="As Featured In" title="Luxury Brands" center />
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                {BRANDS.map((brand) => (
                  <motion.div
                    key={brand}
                    whileHover={{ scale: 1.06 }}
                    className="glass rounded-xl px-5 py-3 cursor-pointer hover:border-primary/30 border border-white/5 transition-colors"
                  >
                    <span className="font-serif text-sm md:text-base font-bold tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors">
                      {brand}
                    </span>
                  </motion.div>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="mt-8 text-center text-xs text-muted-foreground">
                100% authenticated. Every product verified by our luxury experts before dispatch.
              </p>
            </FadeUp>
          </div>
        </section>

        {/* ── CUSTOMER REVIEWS ─────────────────────────���───────────── */}
        <section className="mx-auto max-w-7xl px-4 md:px-6 py-7 md:py-24">
          <FadeUp>
            <div className="text-center mb-7 md:mb-12">
              <SectionHeading eyebrow="Social Proof" title="Loved Worldwide" center />
              <p className="mt-3 text-muted-foreground max-w-md mx-auto text-sm leading-relaxed mt-4">
                Over 2.4 million customers across 180 countries trust Worldwide Shopio for authentic
                luxury.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="glass-strong rounded-3xl p-8 md:p-12 gold-border border max-w-3xl mx-auto text-center"
                >
                  <div className="flex items-center justify-center gap-0.5 mb-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <blockquote className="font-serif text-xl md:text-2xl text-foreground leading-relaxed text-balance">
                    &ldquo;{TESTIMONIALS[activeTestimonial].quote}&rdquo;
                  </blockquote>
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {TESTIMONIALS[activeTestimonial].avatar}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground">
                        {TESTIMONIALS[activeTestimonial].name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3 shrink-0" />
                        {TESTIMONIALS[activeTestimonial].location} &middot;{' '}
                        {TESTIMONIALS[activeTestimonial].product}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() =>
                    setActiveTestimonial((p) => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
                  }
                  className="h-10 w-10 rounded-full glass border border-white/10 hover:border-primary/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
                  aria-label="Previous review"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeTestimonial
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Review ${i + 1}`}
                  />
                ))}
                <button
                  onClick={() => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length)}
                  className="h-10 w-10 rounded-full glass border border-white/10 hover:border-primary/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
                  aria-label="Next review"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </FadeUp>
        </section>

        {/* ── NEWSLETTER ───────────────────────────────────────────── */}
        <section className="relative py-8 md:py-28 overflow-hidden border-t border-white/5">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          </div>
          <div className="relative z-10 mx-auto max-w-2xl px-4 md:px-6 text-center">
            <FadeUp>
              <SectionHeading
                eyebrow="Newsletter"
                title={
                  <>
                    Join the <span className="text-shimmer">Inner Circle</span>
                  </>
                }
                center
              />
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Be first for exclusive drops, private sales, and curated luxury edits from around
                the world.
              </p>
              <form
                className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                onSubmit={(e) => e.preventDefault()}
              >
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground h-12 text-sm focus-visible:ring-primary/50 flex-1"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 tracking-widest text-xs uppercase font-semibold gold-glow shrink-0"
                >
                  Subscribe
                </Button>
              </form>
              <p className="mt-3 text-xs text-muted-foreground">
                No spam. Unsubscribe at any time. Privacy guaranteed.
              </p>
            </FadeUp>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
