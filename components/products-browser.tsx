'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { SlidersHorizontal, X, Search } from 'lucide-react'
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

const QUICK_FILTERS = [
  { label: 'On Sale', value: 'sale' },
  { label: 'New', value: 'new' },
  { label: 'In Stock', value: 'in-stock' },
]

const PAGE_SIZE = 12

/** Normalises a label or slug so `?cat=korean-fashion` matches "Korean Fashion". */
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Maps a `?filter=` preset onto the browser's own filter/sort state. */
function presetToState(preset: string): { quick: string[]; sort: string } {
  switch (preset.toLowerCase()) {
    case 'deals':
    case 'flash':
    case 'clearance':
    case 'bundle':
      return { quick: ['sale'], sort: 'featured' }
    case 'fresh':
      return { quick: ['new'], sort: 'featured' }
    case 'trending':
    case 'bestsellers':
    case 'top50':
    case 'staff':
      return { quick: [], sort: 'rating' }
    default:
      return { quick: [], sort: 'featured' }
  }
}

export function ProductsBrowser({
  products,
  categories,
  initialCategory = '',
  initialBadge = '',
  initialQuery = '',
  initialFilter = '',
  maxPrice = '',
}: {
  products: Product[]
  categories: string[]
  initialCategory?: string
  initialBadge?: string
  initialQuery?: string
  initialFilter?: string
  maxPrice?: string
}) {
  const preset = useMemo(() => presetToState(initialFilter), [initialFilter])

  const resolvedCategory = useMemo(() => {
    if (!initialCategory) return 'All'
    const match = categories.find((c) => slugify(c) === slugify(initialCategory))
    return match ?? initialCategory
  }, [categories, initialCategory])

  const initialQuick = useMemo(() => {
    const set = new Set(preset.quick)
    const badge = initialBadge.toLowerCase()
    if (badge === 'new') set.add('new')
    if (badge === 'sale') set.add('sale')
    return [...set]
  }, [preset.quick, initialBadge])

  const [activeCategory, setActiveCategory] = useState(resolvedCategory)
  const [sort, setSort] = useState(preset.sort)
  const [activeFilters, setActiveFilters] = useState<string[]>(initialQuick)
  const [query, setQuery] = useState(initialQuery)

  const priceCeiling = useMemo(() => {
    const parsed = Number.parseFloat(maxPrice)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [maxPrice])

  const tabs = useMemo(() => ['All', ...categories], [categories])

  const filtered = useMemo(() => {
    let list = [...products]

    if (activeCategory !== 'All') {
      const target = slugify(activeCategory)
      list = list.filter((p) => slugify(p.category) === target)
    }

    const term = query.trim().toLowerCase()
    if (term) {
      list = list.filter((p) =>
        [p.name, p.category, p.description, p.badge ?? ''].join(' ').toLowerCase().includes(term),
      )
    }

    if (activeFilters.includes('sale')) {
      list = list.filter((p) => p.badge === 'Sale' || (p.originalPrice ?? 0) > p.price)
    }
    if (activeFilters.includes('new')) {
      list = list.filter((p) => p.badge === 'New')
    }
    if (activeFilters.includes('in-stock')) {
      list = list.filter((p) => p.inStock)
    }
    if (priceCeiling !== null) {
      list = list.filter((p) => p.price <= priceCeiling)
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
  }, [products, activeCategory, query, activeFilters, priceCeiling, sort])

  /** Keeps the address bar shareable without triggering a server round-trip. */
  useEffect(() => {
    const params = new URLSearchParams()
    if (activeCategory !== 'All') params.set('cat', slugify(activeCategory))
    if (query.trim()) params.set('q', query.trim())
    if (activeFilters.includes('new')) params.set('badge', 'New')
    else if (activeFilters.includes('sale')) params.set('badge', 'Sale')
    if (sort !== 'featured') params.set('sort', sort)
    if (priceCeiling !== null) params.set('maxprice', String(priceCeiling))
    const search = params.toString()
    window.history.replaceState(null, '', search ? `/products?${search}` : '/products')
  }, [activeCategory, query, activeFilters, sort, priceCeiling])

  const toggleFilter = useCallback((f: string) => {
    setActiveFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))
  }, [])

  const clearAll = useCallback(() => {
    setActiveCategory('All')
    setActiveFilters([])
    setQuery('')
    setSort('featured')
  }, [])

  // Pagination resets whenever the filter combination changes, without an effect.
  const filterKey = `${activeCategory}|${query.trim()}|${[...activeFilters].sort().join(',')}|${sort}`
  const [pager, setPager] = useState({ key: filterKey, visible: PAGE_SIZE })
  const visibleCount = pager.key === filterKey ? pager.visible : PAGE_SIZE

  const hasActiveFilters =
    activeCategory !== 'All' || activeFilters.length > 0 || query.trim().length > 0

  const shown = filtered.slice(0, visibleCount)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Discover</p>
            <h1 className="font-serif text-4xl font-bold text-foreground text-balance">
              {query.trim()
                ? `Results for “${query.trim()}”`
                : activeCategory !== 'All'
                  ? activeCategory
                  : 'All Products'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
          {/* Search */}
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="product-search" className="sr-only">
              Search products
            </label>
            <input
              id="product-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, categories, descriptions…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg flex-wrap">
              {tabs.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={activeCategory === cat}
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

            <div className="flex items-center gap-2 flex-wrap">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => toggleFilter(f.value)}
                  aria-pressed={activeFilters.includes(f.value)}
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
              <p className="text-muted-foreground text-pretty text-center">
                {products.length === 0
                  ? 'No products have been published yet.'
                  : 'No products match your search or filters.'}
              </p>
              {products.length > 0 && hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {shown.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {shown.length < filtered.length && (
                <div className="flex justify-center pt-10">
                  <Button
                    variant="outline"
                    onClick={() => setPager({ key: filterKey, visible: visibleCount + PAGE_SIZE })}
                    className="min-w-40"
                  >
                    Load More ({filtered.length - shown.length} left)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
