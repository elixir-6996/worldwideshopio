'use client'

import { Check } from 'lucide-react'

export function Stepper({
  steps,
  current,
  onStepClick,
}: {
  steps: string[]
  current: number
  onStepClick: (index: number) => void
}) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current
        return (
          <li key={step} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => done && onStepClick(index)}
              className={`flex items-center gap-2 text-sm transition-colors ${
                active
                  ? 'font-medium text-foreground'
                  : done
                    ? 'cursor-pointer text-brand'
                    : 'cursor-default text-muted-foreground'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs transition-colors ${
                  done
                    ? 'border-brand bg-brand text-brand-foreground'
                    : active
                      ? 'border-foreground text-foreground'
                      : 'border-border text-muted-foreground'
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </button>
            {index < steps.length - 1 && (
              <span
                className={`h-px w-4 sm:w-8 ${index < current ? 'bg-brand' : 'bg-border'}`}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
