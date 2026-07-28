'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteCoupon, saveCoupon } from '@/app/actions/coupons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type AdminCoupon = {
  id: string
  code: string
  description: string
  discountType: string
  value: number
  active: boolean
  startsAt: string | null
  endsAt: string | null
  usageLimit: number | null
  usageCount: number
  minimumOrderValue: number
  firstOrderOnly: boolean
  freeShipping: boolean
}

const empty = {
  code: '',
  description: '',
  discountType: 'percentage',
  value: 10,
  active: true,
  startsAt: '',
  endsAt: '',
  usageLimit: '',
  minimumOrderValue: 0,
  firstOrderOnly: false,
  freeShipping: false,
}

export function AdminCoupons({ coupons }: { coupons: AdminCoupon[] }) {
  const [editing, setEditing] = useState<AdminCoupon | null>(null)
  const [form, setForm] = useState<Record<string, string | number | boolean>>(empty)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const edit = (coupon: AdminCoupon) => {
    setEditing(coupon)
    setForm({
      ...coupon,
      startsAt: coupon.startsAt?.slice(0, 16) ?? '',
      endsAt: coupon.endsAt?.slice(0, 16) ?? '',
      usageLimit: coupon.usageLimit ?? '',
    })
  }
  const reset = () => {
    setEditing(null)
    setForm(empty)
    setError('')
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await saveCoupon({
        ...form,
        id: editing?.id,
        startsAt: form.startsAt ? new Date(String(form.startsAt)) : null,
        endsAt: form.endsAt ? new Date(String(form.endsAt)) : null,
        usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      })
      reset()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save coupon.')
    } finally {
      setSaving(false)
    }
  }
  const field = (key: string, value: string | number | boolean) =>
    setForm((current) => ({ ...current, [key]: value }))

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground">
            {editing ? 'Edit coupon' : 'Create coupon'}
          </h2>
          {editing && (
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Code">
            <Input
              required
              value={String(form.code)}
              onChange={(e) => field('code', e.target.value.toUpperCase())}
              className="bg-secondary uppercase"
            />
          </Field>
          <Field label="Description">
            <Input
              value={String(form.description)}
              onChange={(e) => field('description', e.target.value)}
              className="bg-secondary"
            />
          </Field>
          <Field label="Discount type">
            <select
              value={String(form.discountType)}
              onChange={(e) => field('discountType', e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </Field>
          <Field label="Discount value">
            <Input
              type="number"
              min="1"
              required
              value={Number(form.value)}
              onChange={(e) => field('value', Number(e.target.value))}
              className="bg-secondary"
            />
          </Field>
          <Field label="Minimum order">
            <Input
              type="number"
              min="0"
              value={Number(form.minimumOrderValue)}
              onChange={(e) => field('minimumOrderValue', Number(e.target.value))}
              className="bg-secondary"
            />
          </Field>
          <Field label="Usage limit">
            <Input
              type="number"
              min="1"
              value={String(form.usageLimit)}
              onChange={(e) => field('usageLimit', e.target.value)}
              placeholder="Unlimited"
              className="bg-secondary"
            />
          </Field>
          <Field label="Starts">
            <Input
              type="datetime-local"
              value={String(form.startsAt)}
              onChange={(e) => field('startsAt', e.target.value)}
              className="bg-secondary"
            />
          </Field>
          <Field label="Ends">
            <Input
              type="datetime-local"
              value={String(form.endsAt)}
              onChange={(e) => field('endsAt', e.target.value)}
              className="bg-secondary"
            />
          </Field>
          <div className="flex flex-wrap items-end gap-4 pb-2">
            {[
              ['active', 'Active'],
              ['firstOrderOnly', 'First order'],
              ['freeShipping', 'Free shipping'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(e) => field(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <Button disabled={saving} className="mt-4 bg-foreground text-background">
          <Plus className="mr-2 h-4 w-4" />
          {saving ? 'Saving…' : editing ? 'Update coupon' : 'Create coupon'}
        </Button>
      </form>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="divide-y divide-border">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{coupon.code}</span>
                  <Badge
                    className={
                      coupon.active ? 'bg-brand/20 text-brand' : 'bg-muted text-muted-foreground'
                    }
                  >
                    {coupon.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {coupon.discountType === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}{' '}
                  off{coupon.freeShipping ? ' + free shipping' : ''} · Used {coupon.usageCount}
                  {coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => edit(coupon)}
                  aria-label={`Edit ${coupon.code}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteCoupon(coupon.id)}
                  aria-label={`Delete ${coupon.code}`}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 block text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
