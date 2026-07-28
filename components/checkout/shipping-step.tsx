'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Loader2, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { searchAddresses } from '@/lib/address-suggestions'
import type { Address } from '@/lib/checkout'

const COUNTRIES: { value: Address['country']; label: string }[] = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
]

const EMPTY: Address = {
  label: 'Home',
  firstName: '',
  lastName: '',
  street: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'US',
}

export type ShippingErrors = Partial<Record<keyof Address | 'email', string>>

export function ShippingStep({
  email,
  onEmailChange,
  address,
  onAddressChange,
  savedAddresses,
  onSelectSaved,
  onSaveAddress,
  saving,
  errors,
}: {
  email: string
  onEmailChange: (value: string) => void
  address: Address
  onAddressChange: (address: Address) => void
  savedAddresses: Address[]
  onSelectSaved: (address: Address) => void
  onSaveAddress: () => void
  saving: boolean
  errors: ShippingErrors
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node))
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const suggestions = useMemo(() => searchAddresses(address.street), [address.street])
  const set = (key: keyof Address, value: string) => onAddressChange({ ...address, [key]: value })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Contact & Shipping</h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ll send order updates to your email.
        </p>
      </div>

      {savedAddresses.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-foreground">Saved addresses</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {savedAddresses.map((saved) => {
              const active =
                saved.street === address.street && saved.postalCode === address.postalCode
              return (
                <button
                  key={saved.id ?? saved.street}
                  type="button"
                  onClick={() => onSelectSaved(saved)}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                    active
                      ? 'border-brand bg-brand/10 text-foreground'
                      : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-brand" /> {saved.label}
                  </span>
                  <span className="mt-1 block truncate">{saved.street}</span>
                  <span className="block truncate text-xs">
                    {saved.city}, {saved.region} {saved.postalCode}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <Field id="email" label="Email" error={errors.email}>
        <Input
          id="email"
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className="bg-secondary"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id="firstName" label="First name" error={errors.firstName}>
          <Input
            id="firstName"
            placeholder="Alex"
            value={address.firstName}
            onChange={(event) => set('firstName', event.target.value)}
            className="bg-secondary"
          />
        </Field>
        <Field id="lastName" label="Last name" error={errors.lastName}>
          <Input
            id="lastName"
            placeholder="Morgan"
            value={address.lastName}
            onChange={(event) => set('lastName', event.target.value)}
            className="bg-secondary"
          />
        </Field>
      </div>

      <div ref={wrapRef} className="relative">
        <Field id="street" label="Street address" error={errors.street}>
          <Input
            id="street"
            autoComplete="off"
            placeholder="Start typing your address…"
            value={address.street}
            onChange={(event) => {
              set('street', event.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            className="bg-secondary"
          />
        </Field>
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-black/60">
            {suggestions.map((suggestion) => (
              <li key={`${suggestion.street}-${suggestion.postalCode}`}>
                <button
                  type="button"
                  onClick={() => {
                    onAddressChange({
                      ...address,
                      street: suggestion.street,
                      city: suggestion.city,
                      region: suggestion.region,
                      postalCode: suggestion.postalCode,
                      country: suggestion.country,
                    })
                    setShowSuggestions(false)
                  }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  <span>
                    <span className="block text-foreground">{suggestion.street}</span>
                    <span className="block text-xs">
                      {suggestion.city}, {suggestion.region} {suggestion.postalCode}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field id="city" label="City" error={errors.city}>
          <Input
            id="city"
            placeholder="New York"
            value={address.city}
            onChange={(event) => set('city', event.target.value)}
            className="bg-secondary"
          />
        </Field>
        <Field id="region" label="State / Region" error={errors.region}>
          <Input
            id="region"
            placeholder="NY"
            value={address.region}
            onChange={(event) => set('region', event.target.value)}
            className="bg-secondary"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field id="postalCode" label="Postal code" error={errors.postalCode}>
          <Input
            id="postalCode"
            placeholder="10118"
            value={address.postalCode}
            onChange={(event) => set('postalCode', event.target.value)}
            className="bg-secondary"
          />
        </Field>
        <Field id="country" label="Country" error={errors.country}>
          <Select value={address.country} onValueChange={(value) => value && set('country', value)}>
            <SelectTrigger id="country" className="bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onSaveAddress}
        disabled={saving}
        className="w-fit border-border text-muted-foreground hover:text-foreground"
      >
        {saving ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="mr-2 h-3.5 w-3.5" />
        )}
        Save this address
      </Button>
    </div>
  )
}

export { EMPTY as EMPTY_ADDRESS }

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block text-sm text-foreground">
        {label}
      </Label>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
          <Check className="hidden" />
          {error}
        </p>
      )}
    </div>
  )
}
