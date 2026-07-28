'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ChevronRight,
  Star,
  ShoppingBag,
  Heart,
  Share2,
  Shield,
  Truck,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Navbar } from '@/components/navbar'
import { DualPrice } from '@/components/dual-price'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/store'
import { MAX_ITEM_QUANTITY } from '@/lib/cart'
import { useCart } from '@/hooks/use-cart'

export function ProductDetailClient({
  product,
  gallery,
  related,
}: {
  product: Product
  gallery: string[]
  related: Product[]
}) {
  const images = useMemo(
    () => (gallery.length ? gallery : [product.image]),
    [gallery, product.image],
  )
  const [activeImage, setActiveImage] = useState(0)

  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes?.[Math.min(2, product.sizes.length - 1)] ?? null,
  )
  const [selectedColor, setSelectedColor] = useState<string | null>(product.colors?.[0] ?? null)
  const [quantity, setQuantity] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  const { count, add } = useCart()

  const handleAddToCart = () => {
    add({
      productId: product.id,
      quantity,
      size: selectedSize ?? undefined,
      color: selectedColor ?? undefined,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={count} />

      <main className="flex-1">
        {/* Breadcrumb */}
        <nav className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/products" className="hover:text-foreground transition-colors">
              Products
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground truncate">{product.name}</span>
          </div>
        </nav>

        <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            {/* Gallery */}
            <div className="flex flex-col gap-3">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
                <Image
                  src={images[activeImage] ?? product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                {product.badge && (
                  <Badge
                    className={`absolute top-4 left-4 border-0 uppercase tracking-wide text-xs ${
                      product.badge === 'Sale'
                        ? 'bg-brand text-brand-foreground'
                        : product.badge === 'Sold Out'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-foreground text-background'
                    }`}
                  >
                    {product.badge}
                  </Badge>
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {images.map((src, index) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-label={`View image ${index + 1} of ${images.length}`}
                      aria-current={index === activeImage}
                      className={`relative aspect-square overflow-hidden rounded-lg bg-secondary border transition-colors ${
                        index === activeImage
                          ? 'border-foreground'
                          : 'border-border hover:border-foreground/40'
                      }`}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  {product.category}
                </p>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground text-balance">
                  {product.name}
                </h1>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-brand text-brand' : 'text-muted-foreground'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-foreground font-medium">{product.rating}</span>
                <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <DualPrice
                  usdCents={product.price * 100}
                  className="text-3xl font-bold text-foreground"
                />
                {product.originalPrice && (
                  <>
                    <DualPrice
                      usdCents={product.originalPrice * 100}
                      className="text-lg text-muted-foreground line-through"
                    />
                    <Badge className="bg-brand/20 text-brand border-0 text-xs">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% off
                    </Badge>
                  </>
                )}
              </div>

              <Separator className="bg-border" />

              {/* Colors */}
              {product.colors && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    Color:{' '}
                    <span className="text-muted-foreground font-normal">{selectedColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-md text-sm border transition-colors ${
                          selectedColor === color
                            ? 'border-foreground bg-secondary text-foreground'
                            : 'border-border text-muted-foreground hover:border-foreground/40'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {product.sizes && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-foreground">
                      Size:{' '}
                      <span className="text-muted-foreground font-normal">{selectedSize}</span>
                    </p>
                    <button className="text-xs text-muted-foreground underline hover:text-foreground transition-colors">
                      Size Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-10 rounded-md text-sm border font-medium transition-colors ${
                          selectedSize === size
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border text-muted-foreground hover:border-foreground/40'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Actions */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center border border-border rounded-md">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-foreground">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => Math.min(MAX_ITEM_QUANTITY, q + 1))}
                    className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    +
                  </button>
                </div>

                <Button
                  className="flex-1 bg-foreground text-background hover:bg-foreground/80 font-medium h-10"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  {!product.inStock ? 'Out of Stock' : addedToCart ? 'Added!' : 'Add to Cart'}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className={`h-10 w-10 border-border ${wishlisted ? 'text-red-400 border-red-400/40' : 'text-muted-foreground'}`}
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-pressed={wishlisted}
                  onClick={() => setWishlisted((w) => !w)}
                >
                  <Heart className={`h-4 w-4 ${wishlisted ? 'fill-red-400' : ''}`} />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-border text-muted-foreground"
                  aria-label="Share product"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Perks */}
              <div className="grid grid-cols-3 gap-3 mt-1">
                {[
                  { icon: Truck, label: 'Free Shipping', sub: 'Qualifying orders' },
                  { icon: RotateCcw, label: 'Free Returns', sub: '30 days' },
                  { icon: Shield, label: 'Authentic', sub: 'Guaranteed' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1 rounded-lg bg-secondary p-3 text-center"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground">{sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-16">
            <Tabs defaultValue="description">
              <TabsList className="bg-secondary border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
                {['description', 'details', 'reviews'].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent py-3 px-6 text-sm text-muted-foreground data-[state=active]:text-foreground"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="description" className="mt-6">
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {product.description}
                </p>
              </TabsContent>
              <TabsContent value="details" className="mt-6">
                <ul className="text-sm text-muted-foreground space-y-2 max-w-md">
                  {[
                    'Premium materials',
                    'Ethically sourced',
                    'Handcrafted finishing',
                    'Season-spanning design',
                  ].map((d) => (
                    <li key={d} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand flex-shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="reviews" className="mt-6">
                <p className="text-sm text-muted-foreground">
                  {product.reviews} verified reviews — avg. {product.rating}/5
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-20">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
                You May Also Like
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {related.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={(item) => add({ productId: item.id, quantity: 1 })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
