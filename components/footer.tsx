'use client'

import Link from 'next/link'
import {
  Camera,
  Send,
  Play,
  Link2,
  Globe,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Bookmark,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const FOOTER_LINKS = {
  Shop: [
    { label: 'All Products', href: '/products' },
    { label: 'New Arrivals', href: '/products?badge=New' },
    { label: 'Best Sellers', href: '/products' },
    { label: 'Sale', href: '/products?badge=Sale' },
    { label: 'Collections', href: '/products' },
  ],
  Categories: [
    { label: 'Fashion', href: '/products?cat=fashion' },
    { label: 'Electronics', href: '/products?cat=electronics' },
    { label: 'Accessories', href: '/products?cat=accessories' },
    { label: 'Home & Living', href: '/products?cat=home' },
    { label: 'Beauty', href: '/products?cat=beauty' },
  ],
  'Customer Support': [
    { label: 'FAQ', href: '/' },
    { label: 'Shipping', href: '/' },
    { label: 'Returns', href: '/' },
    { label: 'Track Order', href: '/' },
    { label: 'Contact Us', href: '/' },
  ],
  Company: [
    { label: 'About Us', href: '/' },
    { label: 'Privacy Policy', href: '/' },
    { label: 'Terms of Service', href: '/' },
    { label: 'Careers', href: '/' },
    { label: 'Partners', href: '/' },
  ],
}

const SOCIAL_LINKS = [
  { label: 'Instagram', icon: Camera },
  { label: 'Facebook', icon: Link2 },
  { label: 'YouTube', icon: Play },
  { label: 'LinkedIn', icon: ExternalLink },
  { label: 'Pinterest', icon: Bookmark },
  { label: 'Twitter / X', icon: Send },
]

const REGIONS = ['United States', 'Europe', 'Asia Pacific', 'Middle East', 'United Kingdom']

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-card mt-24">
      {/* Newsletter strip */}
      <div className="border-b border-white/8 bg-[oklch(0.08_0_0)]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-serif text-xl text-foreground mb-1">Join the Inner Circle</p>
            <p className="text-sm text-muted-foreground">
              Exclusive offers, early access, and luxury curation delivered to your inbox.
            </p>
          </div>
          <form className="flex gap-2 w-full max-w-sm" onSubmit={(e) => e.preventDefault()}>
            <Input
              type="email"
              name="email"
              aria-label="Email address"
              autoComplete="email"
              placeholder="Your email address"
              className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground h-10 text-sm focus-visible:ring-primary/50"
            />
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 tracking-widest text-xs uppercase px-5"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-10">
          {/* Brand */}
          <div className="md:col-span-3 flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-2 group">
              <Globe className="h-5 w-5 text-primary" />
              <span className="font-serif text-lg font-bold tracking-[0.2em] uppercase text-shimmer">
                Worldwide Shopio
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The world&apos;s premier destination for luxury fashion and lifestyle goods. Curated
              with purpose. Delivered worldwide.
            </p>
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                <span>123 Fashion Ave, New York, NY 10001</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                <span>hello@worldwideshopio.com</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                <span>+1 (800) 555-0190</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {SOCIAL_LINKS.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  aria-label={`${label} profile unavailable`}
                  role="img"
                  className="h-8 w-8 flex items-center justify-center rounded-full border border-white/10 text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title} className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-primary/80">
                {title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Regions */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Ship to your region
          </p>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((region) => (
              <button
                key={region}
                className="text-xs px-3 py-1.5 rounded-full border border-white/8 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        <Separator className="my-8 bg-white/5" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Worldwide Shopio. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-foreground transition-colors">
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
