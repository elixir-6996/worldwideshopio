'use client'

import { useState, useMemo } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/store'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

export function ProductsBrowser({
  products,
  categories,
}: {
  products: Product[]
  categories: string[]
}) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [sort, setSort] = useState('featured')
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const tabs = useMemo(() => ['All', ...categories], [categories])

  const filtered = useMemo(() => {
    let list = [...products]
    if (activeCategory !== 'All') {
      list = list.filter((p) => p.category === activeCategory)
    }
    if (activeFilters.includes('sale')) {
      list = list.filter((p) => p.badge === 'Sale')
    }
    if (activeFilters.includes('in-stock')) {
      list = list.filter((p) => p.inStock)
    }
    if (activeFilters.includes('new')) {
      list = list.filter((p) => p.badge === 'New')
    }
    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        list.sort((a, b) => b.rating - a.rating)
        break
    }
    return list
  }, [products, activeCategory, sort, activeFilters])

  const toggleFilter = (f: string) => {
    setActiveFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Discover</p>
            <h1 className="font-serif text-4xl font-bold text-foreground">All Products</h1>
            <p className="text-sm text-muted-foreground mt-2">{filtered.length} items</p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
          {/* Filters Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg flex-wrap">
                {tabs.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeCategory === cat
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick filter badges */}
              {[
                { label: 'On Sale', value: 'sale' },
                { label: 'New', value: 'new' },
                { label: 'In Stock', value: 'in-stock' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => toggleFilter(f.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activeFilters.includes(f.value)
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                  {activeFilters.includes(f.value) && <X className="h-3 w-3" />}
                </button>
              ))}

              <Select value={sort} onValueChange={(v) => setSort(v ?? 'featured')}>
                <SelectTrigger className="w-44 h-8 text-xs bg-secondary border-border">
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs text-foreground"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <p className="text-muted-foreground">
                {products.length === 0
                  ? 'No products have been published yet.'
                  : 'No products match your filters.'}
              </p>
              {products.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveCategory('All')
                    setActiveFilters([])
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
