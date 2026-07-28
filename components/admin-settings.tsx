'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { saveStoreSettings } from '@/app/actions/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type AdminStoreSettings = {
  storeName: string
  tagline: string
  supportEmail: string
  currency: string
  freeShippingThreshold: number
  standardShippingRate: number
  expressShippingRate: number
}

export function AdminSettings({ settings }: { settings: AdminStoreSettings }) {
  const [form, setForm] = useState(settings)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState('')

  const field = <K extends keyof AdminStoreSettings>(key: K, value: AdminStoreSettings[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    setStatus('idle')
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('saving')
    setError('')
    const result = await saveStoreSettings(form)
    if (result.ok) setStatus('saved')
    else {
      setStatus('idle')
      setError(result.error)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-border bg-card p-5 flex flex-col gap-5 max-w-2xl"
    >
      <div>
        <h2 className="font-semibold text-foreground">Store settings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Shipping rates and thresholds are applied at checkout.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store-name">Store name</Label>
          <Input
            id="store-name"
            value={form.storeName}
            onChange={(event) => field('storeName', event.target.value)}
            required
            className="bg-secondary border-border"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store-currency">Currency</Label>
          <Input
            id="store-currency"
            value={form.currency}
            maxLength={3}
            onChange={(event) => field('currency', event.target.value.toUpperCase())}
            required
            className="bg-secondary border-border"
          />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label htmlFor="store-tagline">Tagline</Label>
          <Input
            id="store-tagline"
            value={form.tagline}
            onChange={(event) => field('tagline', event.target.value)}
            className="bg-secondary border-border"
          />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label htmlFor="store-email">Support email</Label>
          <Input
            id="store-email"
            type="email"
            value={form.supportEmail}
            onChange={(event) => field('supportEmail', event.target.value)}
            className="bg-secondary border-border"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store-free-shipping">Free shipping over ($)</Label>
          <Input
            id="store-free-shipping"
            type="number"
            min="0"
            value={form.freeShippingThreshold}
            onChange={(event) => field('freeShippingThreshold', Number(event.target.value))}
            className="bg-secondary border-border"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store-standard">Standard shipping ($)</Label>
          <Input
            id="store-standard"
            type="number"
            min="0"
            value={form.standardShippingRate}
            onChange={(event) => field('standardShippingRate', Number(event.target.value))}
            className="bg-secondary border-border"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store-express">Express shipping ($)</Label>
          <Input
            id="store-express"
            type="number"
            min="0"
            value={form.expressShippingRate}
            onChange={(event) => field('expressShippingRate', Number(event.target.value))}
            className="bg-secondary border-border"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={status === 'saving'}
          className="bg-foreground text-background hover:bg-foreground/80 gap-2"
        >
          {status === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save settings
        </Button>
        {status === 'saved' && <span className="text-xs text-brand">Settings saved.</span>}
      </div>
    </form>
  )
}
