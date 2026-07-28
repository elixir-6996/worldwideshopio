'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { signInAdmin, signInCustomer } from '@/app/actions/customer'

type Mode = 'login' | 'register' | 'forgot'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'forgot') {
      setSubmitted(true)
      return
    }
    startTransition(() => signInCustomer(email, mode === 'register' ? name : undefined))
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left: Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-2xl font-bold tracking-widest uppercase text-foreground self-start"
          >
            LUXE
          </Link>

          {submitted && mode === 'forgot' ? (
            <div className="flex flex-col gap-4 py-6">
              <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-brand" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Check your email</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We sent a reset link to <span className="text-foreground font-medium">{email}</span>
                . Check your inbox and follow the instructions.
              </p>
              <button
                onClick={() => {
                  setMode('login')
                  setSubmitted(false)
                }}
                className="text-sm text-brand hover:underline self-start"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground">
                  {mode === 'login'
                    ? 'Welcome back'
                    : mode === 'register'
                      ? 'Create account'
                      : 'Reset password'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {mode === 'login'
                    ? 'Sign in to your LUXE account'
                    : mode === 'register'
                      ? 'Join LUXE for exclusive access'
                      : "Enter your email and we'll send a link"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === 'register' && (
                  <div>
                    <Label htmlFor="name" className="text-sm text-foreground mb-1.5 block">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="email" className="text-sm text-foreground mb-1.5 block">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor="password" className="text-sm text-foreground">
                        Password
                      </Label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-xs text-muted-foreground hover:text-brand transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isPending}
                  size="lg"
                  className="bg-foreground text-background hover:bg-foreground/80 font-medium mt-1 w-full"
                >
                  {isPending
                    ? 'Opening your account...'
                    : mode === 'login'
                      ? 'Sign In'
                      : mode === 'register'
                        ? 'Create Account'
                        : 'Send Reset Link'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              {mode !== 'forgot' && (
                <>
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">or continue as</span>
                    <Separator className="flex-1 bg-border" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() => signInCustomer('alex@luxe.demo', 'Alex Morgan'))
                      }
                      className="border-border text-muted-foreground hover:text-foreground text-sm"
                    >
                      User Demo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => startTransition(() => signInAdmin())}
                      className="border-border text-muted-foreground hover:text-foreground text-sm"
                    >
                      Admin Demo
                    </Button>
                  </div>
                </>
              )}

              <p className="text-sm text-center text-muted-foreground">
                {mode === 'login' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      onClick={() => setMode('register')}
                      className="text-brand hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </>
                ) : mode === 'register' ? (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('login')}
                      className="text-brand hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setMode('login')}
                    className="text-brand hover:underline font-medium"
                  >
                    Back to sign in
                  </button>
                )}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right: Brand Panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <Image
          src="/images/hero-banner.png"
          alt="LUXE Collection"
          fill
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-background/60" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <blockquote className="max-w-sm">
            <p className="font-serif text-2xl font-bold text-foreground leading-relaxed text-balance">
              &ldquo;Premium essentials for those who value quality over quantity.&rdquo;
            </p>
            <footer className="mt-4 text-sm text-muted-foreground">— The LUXE Philosophy</footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}
