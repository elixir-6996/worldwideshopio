'use client'

import { useState, useTransition } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Bell, CreditCard, MapPin, Plus, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { addAddress, deleteAddress, updatePreferences, updateProfile } from '@/app/actions/customer'
import type {
  AddressRecord,
  PaymentRecord,
  PreferenceRecord,
  ProfileRecord,
} from '@/lib/dashboard-types'

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      data-animate
      className="rounded-xl border border-border bg-card p-5 md:p-6 flex flex-col gap-5"
    >
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="h-4 w-4 text-brand" />
        </div>
        <h2 className="font-serif text-xl font-semibold">{title}</h2>
      </div>
      <Separator />
      {children}
    </section>
  )
}

export function AccountSection({
  profile,
  addresses,
  preferences,
  payments,
}: {
  profile: ProfileRecord
  addresses: AddressRecord[]
  preferences: PreferenceRecord
  payments: PaymentRecord[]
}) {
  const [showAddress, setShowAddress] = useState(false)
  const [prefs, setPrefs] = useState(preferences)
  const [isPending, startTransition] = useTransition()
  const fields = [
    ['orderUpdates', 'Order updates', 'Shipping and delivery progress'],
    ['promotions', 'Private offers', 'Member-only promotions'],
    ['newArrivals', 'New arrivals', 'Fresh pieces selected for you'],
    ['smsUpdates', 'SMS updates', 'Time-sensitive delivery notices'],
  ] as const

  return (
    <div className="flex flex-col gap-6">
      <div data-animate>
        <p className="text-xs uppercase tracking-[0.2em] text-brand">Personal details</p>
        <h1 className="font-serif text-3xl font-bold">Account</h1>
      </div>
      <Section icon={User} title="Profile">
        <form action={updateProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              name="firstName"
              defaultValue={profile.firstName}
              required
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              name="lastName"
              defaultValue={profile.lastName}
              required
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={profile.phone} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="birthday">Birthday</Label>
            <Input
              id="birthday"
              name="birthday"
              type="date"
              defaultValue={profile.birthday}
              className="mt-2"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Email</Label>
            <Input value={profile.email} readOnly className="mt-2 opacity-70" />
          </div>
          <Button type="submit" className="sm:col-span-2 sm:w-fit">
            Save profile
          </Button>
        </form>
      </Section>
      <Section icon={MapPin} title="Saved addresses">
        <div className="grid sm:grid-cols-2 gap-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-lg border border-border bg-secondary p-4 flex justify-between gap-4"
            >
              <div className="text-sm">
                <p className="font-medium">{address.label}</p>
                <p className="text-muted-foreground mt-1">
                  {address.street}
                  <br />
                  {address.city}, {address.region} {address.postalCode}
                  <br />
                  {address.country}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete ${address.label}`}
                onClick={() => startTransition(() => deleteAddress(address.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={() => setShowAddress(!showAddress)} className="w-fit">
          <Plus className="h-4 w-4" /> Add address
        </Button>
        {showAddress && (
          <form
            action={async (data) => {
              await addAddress(data)
              setShowAddress(false)
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border pt-5"
          >
            {[
              ['label', 'Label'],
              ['firstName', 'First name'],
              ['lastName', 'Last name'],
              ['street', 'Street'],
              ['city', 'City'],
              ['region', 'State / region'],
              ['postalCode', 'Postal code'],
              ['country', 'Country'],
            ].map(([name, label]) => (
              <div key={name}>
                <Label htmlFor={`address-${name}`}>{label}</Label>
                <Input id={`address-${name}`} name={name} required className="mt-2" />
              </div>
            ))}
            <Button type="submit" className="sm:col-span-2 sm:w-fit">
              Save address
            </Button>
          </form>
        )}
      </Section>
      <Section icon={CreditCard} title="Payment methods">
        {payments.length ? (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-lg border border-border p-4 flex justify-between text-sm"
            >
              <span className="uppercase">
                {payment.brand} •••• {payment.lastFour}
              </span>
              <span className="text-muted-foreground">
                {String(payment.expiryMonth).padStart(2, '0')}/
                {String(payment.expiryYear).slice(-2)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Saved payment methods appear here after a supported checkout. LUXE never stores full
            card numbers.
          </p>
        )}
      </Section>
      <Section icon={Bell} title="Communication preferences">
        <div className="flex flex-col gap-1">
          {fields.map(([key, label, description]) => (
            <label
              key={key}
              className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0 cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(event) => setPrefs({ ...prefs, [key]: event.target.checked })}
                className="size-4 accent-[var(--primary)]"
              />
            </label>
          ))}
        </div>
        <Button
          disabled={isPending}
          onClick={() => startTransition(() => updatePreferences(prefs))}
          className="w-fit"
        >
          {isPending ? 'Saving...' : 'Save preferences'}
        </Button>
      </Section>
    </div>
  )
}
