import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { headers } from 'next/headers'
import { CurrencyProvider } from '@/components/currency-provider'
import { CartProvider } from '@/components/cart-provider'
import { getCartCount } from '@/lib/cart'
import { getCurrencyConfig, getUsdToInrRate } from '@/lib/currency'
import './globals.css'

const _inter = Inter({ subsets: ['latin'] })
const _playfair = Playfair_Display({ subsets: ['latin'] })

const siteUrl = new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://worldwideshopio.com')

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: 'Worldwide Shopio — Global Luxury E-Commerce',
    template: '%s | Worldwide Shopio',
  },
  description:
    "Discover the world's finest luxury fashion, accessories, and lifestyle products. Premium quality, worldwide shipping.",
  keywords: [
    'luxury fashion',
    'premium e-commerce',
    'worldwide shipping',
    'designer goods',
    'luxury accessories',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Worldwide Shopio',
    title: 'Worldwide Shopio — Global Luxury E-Commerce',
    description: 'Premium fashion, accessories, and lifestyle products delivered worldwide.',
    images: [
      {
        url: '/images/hero-banner.png',
        width: 1200,
        height: 630,
        alt: 'Worldwide Shopio luxury collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Worldwide Shopio — Global Luxury E-Commerce',
    description: 'Premium fashion, accessories, and lifestyle products delivered worldwide.',
    images: ['/images/hero-banner.png'],
  },
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0F0F0F',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers()
  const country = headerList.get('x-vercel-ip-country')
  const [usdToInr, cartCount] = await Promise.all([getUsdToInrRate(), getCartCount()])
  const currencyConfig = getCurrencyConfig(country, usdToInr)

  return (
    <html lang="en" className="bg-background">
      <body className="antialiased font-sans min-h-screen">
        <CurrencyProvider config={currencyConfig}>
          <CartProvider initialCount={cartCount}>{children}</CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  )
}
