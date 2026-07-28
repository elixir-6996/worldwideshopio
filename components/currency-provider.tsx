'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { CurrencyConfig } from '@/lib/currency'

const CurrencyContext = createContext<CurrencyConfig | null>(null)

export function CurrencyProvider({
  config,
  children,
}: {
  config: CurrencyConfig
  children: ReactNode
}) {
  return <CurrencyContext.Provider value={config}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const value = useContext(CurrencyContext)
  if (!value) throw new Error('useCurrency must be used within CurrencyProvider')
  return value
}
