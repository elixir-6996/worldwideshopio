'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Star, ShoppingBag, Check, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/store'
import { DualPrice } from '@/components/dual-price'
import { useCart } from '@/components/cart-provider'
import { addToCart } from '@/app/actions/cart'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const { setCount } = useCart()
  const [pending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)
  const [error, setError] = useState('')

  const quickAdd = (event: React.MouseEvent) => {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await addToCart({
        productId: product.id,
        quantity: 1,
        // Quick Add takes the first variant; the detail page offers the full choice.
        size: product.sizes?.[0],
        color: product.colors?.[0],
      })
      setCount(result.count)
      if (result.error) {
        setError(result.error)
        return
      }
      setAdded(true)
      router.refresh()
      setTimeout(() => setAdded(false), 1800)
    })
  }

  return (
    <div className="group relative flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:border-foreground/20 transition-all duration-300">
      {/* Image */}
      <Link
        href={`/products/${product.id}`}
        className="relative overflow-hidden aspect-square bg-secondary"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {product.badge && (
          <Badge
            className={`absolute top-3 left-3 text-xs font-medium uppercase tracking-wide border-0 ${
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
        {/* Quick Add overlay */}
        {product.inStock && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 focus-within:translate-y-0 transition-transform duration-300 p-3">
            <Button
              size="sm"
              className="w-full bg-foreground/90 text-background hover:bg-foreground backdrop-blur-sm"
              onClick={quickAdd}
              disabled={pending}
              aria-label={`Add ${product.name} to cart`}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : added ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <ShoppingBag className="h-4 w-4 mr-2" />
              )}
              {added ? 'Added' : 'Quick Add'}
            </Button>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.category}</p>
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-medium text-foreground leading-snug hover:text-brand transition-colors text-balance">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'fill-brand text-brand' : 'text-muted-foreground'}`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <DualPrice
            usdCents={product.price * 100}
            className="text-sm font-semibold text-foreground"
          />
          {product.originalPrice && (
            <DualPrice
              usdCents={product.originalPrice * 100}
              className="text-xs text-muted-foreground line-through"
            />
          )}
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
