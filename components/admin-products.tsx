'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import {
  GripVertical,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  deleteProduct,
  deleteProductImage,
  reorderProducts,
  saveProduct,
  setProductStatus,
  uploadProductImage,
} from '@/app/actions/products'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type AdminProduct = {
  id: string
  slug: string
  name: string
  description: string
  category: string
  price: number
  originalPrice: number | null
  images: string[]
  sizes: string[]
  colors: string[]
  rating: number
  reviews: number
  inStock: boolean
  badge: string | null
  status: string
  sortOrder: number
}

type FormState = {
  name: string
  slug: string
  description: string
  category: string
  price: string
  originalPrice: string
  images: string[]
  sizes: string
  colors: string
  rating: string
  reviews: string
  inStock: boolean
  badge: string
  status: 'draft' | 'published'
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  category: '',
  price: '',
  originalPrice: '',
  images: [],
  sizes: '',
  colors: '',
  rating: '0',
  reviews: '0',
  inStock: true,
  badge: '',
  status: 'draft',
}

function toForm(product: AdminProduct): FormState {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category,
    price: String(product.price),
    originalPrice: product.originalPrice ? String(product.originalPrice) : '',
    images: product.images,
    sizes: product.sizes.join(', '),
    colors: product.colors.join(', '),
    rating: String(product.rating),
    reviews: String(product.reviews),
    inStock: product.inStock,
    badge: product.badge ?? '',
    status: product.status === 'published' ? 'published' : 'draft',
  }
}

export function AdminProducts({ products }: { products: AdminProduct[] }) {
  const [search, setSearch] = useState('')
  const [order, setOrder] = useState(products)
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragRow, setDragRow] = useState<string | null>(null)
  const [dragImage, setDragImage] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()
  const fileInput = useRef<HTMLInputElement>(null)

  // Keep the local list in sync when the server sends a fresh snapshot.
  const signature = products.map((product) => product.id).join('|')
  const [lastSignature, setLastSignature] = useState(signature)
  if (signature !== lastSignature) {
    setLastSignature(signature)
    setOrder(products)
  }

  const visible = order.filter((product) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return (
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term) ||
      product.slug.toLowerCase().includes(term)
    )
  })

  const field = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setFieldErrors({})
    setFormOpen(true)
  }

  const openEdit = (product: AdminProduct) => {
    setEditing(product)
    setForm(toForm(product))
    setError('')
    setFieldErrors({})
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setFieldErrors({})
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setError('')
    const uploaded: string[] = []
    for (const file of Array.from(files).slice(0, 8)) {
      const data = new FormData()
      data.set('file', file)
      const result = await uploadProductImage(data)
      if (result.ok) uploaded.push(result.url)
      else setError(result.error)
    }
    if (uploaded.length) {
      setForm((previous) => ({ ...previous, images: [...previous.images, ...uploaded].slice(0, 8) }))
    }
    setUploading(false)
    if (fileInput.current) fileInput.current.value = ''
  }

  const removeImage = (index: number) => {
    const url = form.images[index]
    setForm((previous) => ({
      ...previous,
      images: previous.images.filter((_, position) => position !== index),
    }))
    // Only detached uploads are purged; seeded local paths are left alone.
    if (url?.startsWith('http')) void deleteProductImage(url)
  }

  const moveImage = (from: number, to: number) => {
    if (from === to) return
    setForm((previous) => {
      const next = [...previous.images]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return { ...previous, images: next }
    })
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    const result = await saveProduct({
      id: editing?.id,
      name: form.name,
      slug: form.slug,
      description: form.description,
      category: form.category,
      price: form.price,
      originalPrice: form.originalPrice === '' ? null : form.originalPrice,
      images: form.images,
      sizes: form.sizes,
      colors: form.colors,
      rating: form.rating,
      reviews: form.reviews,
      inStock: form.inStock,
      badge: form.badge,
      status: form.status,
    })
    setSaving(false)
    if (result.ok) closeForm()
    else {
      setError(result.error)
      setFieldErrors(result.fieldErrors ?? {})
    }
  }

  const remove = (product: AdminProduct) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteProduct(product.id)
      if (!result.ok) setError(result.error)
    })
  }

  const toggleStatus = (product: AdminProduct) => {
    const next = product.status === 'published' ? 'draft' : 'published'
    startTransition(async () => {
      const result = await setProductStatus(product.id, next)
      if (!result.ok) setError(result.error)
    })
  }

  const dropRow = (targetId: string) => {
    if (!dragRow || dragRow === targetId) return setDragRow(null)
    const next = [...order]
    const from = next.findIndex((product) => product.id === dragRow)
    const to = next.findIndex((product) => product.id === targetId)
    if (from < 0 || to < 0) return setDragRow(null)
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setOrder(next)
    setDragRow(null)
    startTransition(async () => {
      const result = await reorderProducts(next.map((product) => product.id))
      if (!result.ok) setError(result.error)
    })
  }

  const busy = saving || pending

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Button
          size="sm"
          onClick={openCreate}
          className="bg-foreground text-background hover:bg-foreground/80 gap-2 shrink-0 text-xs"
        >
          <Plus className="h-3.5 w-3.5" /> Add Product
        </Button>
      </div>

      {error && !formOpen && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {formOpen && (
        <form
          onSubmit={submit}
          className="rounded-xl border border-border bg-card p-5 flex flex-col gap-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">
              {editing ? `Edit ${editing.name}` : 'New product'}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeForm}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close form</span>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(event) => field('name', event.target.value)}
                required
                className="bg-secondary border-border"
              />
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-category">Category</Label>
              <Input
                id="product-category"
                value={form.category}
                onChange={(event) => field('category', event.target.value)}
                required
                className="bg-secondary border-border"
              />
              {fieldErrors.category && (
                <p className="text-xs text-destructive">{fieldErrors.category}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-price">Price (USD)</Label>
              <Input
                id="product-price"
                type="number"
                min="1"
                value={form.price}
                onChange={(event) => field('price', event.target.value)}
                required
                className="bg-secondary border-border"
              />
              {fieldErrors.price && <p className="text-xs text-destructive">{fieldErrors.price}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-compare">Compare-at price</Label>
              <Input
                id="product-compare"
                type="number"
                min="0"
                value={form.originalPrice}
                onChange={(event) => field('originalPrice', event.target.value)}
                className="bg-secondary border-border"
              />
              {fieldErrors.originalPrice && (
                <p className="text-xs text-destructive">{fieldErrors.originalPrice}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-sizes">Sizes (comma separated)</Label>
              <Input
                id="product-sizes"
                value={form.sizes}
                onChange={(event) => field('sizes', event.target.value)}
                placeholder="XS, S, M, L"
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-colors">Colors (comma separated)</Label>
              <Input
                id="product-colors"
                value={form.colors}
                onChange={(event) => field('colors', event.target.value)}
                placeholder="Black, Ivory"
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-badge">Badge</Label>
              <Input
                id="product-badge"
                value={form.badge}
                onChange={(event) => field('badge', event.target.value)}
                placeholder="New, Sale"
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-slug">URL slug</Label>
              <Input
                id="product-slug"
                value={form.slug}
                onChange={(event) => field('slug', event.target.value)}
                placeholder="auto-generated from name"
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-rating">Rating</Label>
              <Input
                id="product-rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={(event) => field('rating', event.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-reviews">Review count</Label>
              <Input
                id="product-reviews"
                type="number"
                min="0"
                value={form.reviews}
                onChange={(event) => field('reviews', event.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              rows={4}
              value={form.description}
              onChange={(event) => field('description', event.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-foreground mb-2">
              Images{' '}
              <span className="text-xs font-normal text-muted-foreground">
                (drag to reorder, first image is the thumbnail)
              </span>
            </legend>
            <div className="flex flex-wrap gap-3">
              {form.images.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  draggable
                  onDragStart={() => setDragImage(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragImage !== null) moveImage(dragImage, index)
                    setDragImage(null)
                  }}
                  className={`relative w-24 h-24 rounded-lg overflow-hidden border bg-secondary cursor-grab ${
                    dragImage === index ? 'border-brand opacity-60' : 'border-border'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`Product image ${index + 1}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-background/80 text-foreground text-[10px] text-center py-0.5">
                      Thumbnail
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 rounded-full bg-background/90 p-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove image {index + 1}</span>
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  void handleUpload(event.dataTransfer.files)
                }}
                disabled={uploading}
                className="w-24 h-24 rounded-lg border border-dashed border-border bg-secondary/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                <span className="text-[10px]">{uploading ? 'Uploading' : 'Add image'}</span>
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              multiple
              hidden
              onChange={(event) => void handleUpload(event.target.files)}
            />
            <p className="text-xs text-muted-foreground">
              PNG, JPEG, WebP, or AVIF up to 4MB each. You can also drop files onto the tile.
            </p>
          </fieldset>

          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(event) => field('inStock', event.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              In stock
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.status === 'published'}
                onChange={(event) => field('status', event.target.checked ? 'published' : 'draft')}
                className="h-4 w-4 accent-brand"
              />
              Published
            </label>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={busy || uploading}
              className="bg-foreground text-background hover:bg-foreground/80 gap-2"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editing ? 'Save changes' : 'Create product'}
            </Button>
            <Button type="button" variant="ghost" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
          <span className="col-span-5">Product</span>
          <span className="col-span-2">Category</span>
          <span className="col-span-2 text-right">Price</span>
          <span className="col-span-1 text-center">Status</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {visible.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No products yet. Use “Add Product” to create your first listing.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {visible.map((product) => (
              <div
                key={product.id}
                draggable={!search}
                onDragStart={() => setDragRow(product.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dropRow(product.id)}
                className={`grid grid-cols-12 gap-4 px-5 py-4 items-center ${
                  dragRow === product.id ? 'opacity-60' : ''
                }`}
              >
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  {!search && (
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                  )}
                  <div className="relative w-10 h-10 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                    <Image
                      src={product.images[0] ?? '/images/product-1.png'}
                      alt={product.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-muted-foreground">★ {product.rating}</span>
                      {product.badge && (
                        <Badge className="text-xs bg-brand/20 text-brand border-0 py-0 h-4">
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground">{product.category}</span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-sm font-semibold text-foreground">${product.price}</span>
                  {product.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through ml-1">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => toggleStatus(product)}
                    disabled={pending}
                    className="text-xs"
                  >
                    <Badge
                      className={`text-xs border-0 ${
                        product.status === 'published'
                          ? 'bg-brand/20 text-brand'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {product.status === 'published' ? 'Live' : 'Draft'}
                    </Badge>
                  </button>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(product)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">Edit {product.name}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(product)}
                    disabled={pending}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete {product.name}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!search && order.length > 1 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Upload className="h-3 w-3" /> Drag rows to change the order products appear in the
          storefront.
        </p>
      )}
    </div>
  )
}
