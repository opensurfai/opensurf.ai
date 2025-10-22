import { cn } from '@/utils/utils';
import { createServerFn } from '@tanstack/react-start';
import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: Turnstile.Turnstile
  }
}

// Server function to join the waitlist
type JoinWaitlistInput = { email: string; token: string }

export const joinWaitlist = createServerFn({ method: 'POST' })
  .inputValidator((input: JoinWaitlistInput) => {
    const email = (input?.email || '').trim().toLowerCase()
    const token = String(input?.token || '')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email')
    }
    if (!token) {
      throw new Error('Missing Turnstile token')
    }
    return { email, token }
  })
  .handler(async ({ data }) => {
    // Import server-only deps inside the handler to avoid client bundling
    const { env } = await import('cloudflare:workers')
    const { Resend } = await import('resend')

    const resend = new Resend(env.RESEND_API_KEY)

    try {
      // Verify Turnstile token
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: data.token,
        }),
      })
      const verifyJson = (await verifyRes.json()) as {
        success?: boolean
        'error-codes'?: string[]
      }
      if (!verifyJson?.success) {
        return {
          ok: false as const,
          error: 'Turnstile verification failed',
        }
      }

      await resend.contacts.create({
        email: data.email,
        audienceId: env.RESEND_AUDIENCE_ID,
      })
      return { ok: true } as const
    } catch (err: any) {
      // Surface a friendly error while preserving status semantics
      const message: string =
        typeof err?.message === 'string' ? err.message : 'Failed to join waitlist'
      return { ok: false, error: message } as const
    }
  })

// (Client will read the public site key from import.meta.env.VITE_TURNSTILE_SITE_KEY)

function startViewTransition(update: () => void) {
  if (typeof document !== 'undefined' && (document as any).startViewTransition) {
    return (document as any).startViewTransition(update)
  }
  update()
  return { finished: Promise.resolve() } as const
}

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string>('')
  const [widgetId, setWidgetId] = useState<string>('')
  const [scriptReady, setScriptReady] = useState<boolean>(false)
  const containerRef = useRef<HTMLFormElement | null>(null)

  // Load Turnstile site key and mark script ready (script is preloaded in __root)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Poll briefly until the global is available
      let attempts = 0
      const iv = setInterval(() => {
        attempts++
        if (window.turnstile) {
          clearInterval(iv)
          setScriptReady(true)
        } else if (attempts > 50) {
          clearInterval(iv)
          setScriptReady(false)
        }
      }, 50)
      return () => clearInterval(iv)
    }
  }, [])

  const widgetRef = useRef<HTMLDivElement>(null!)

  // Render the widget once script & siteKey are ready
  useEffect(() => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
    if (!scriptReady || !siteKey || !widgetRef.current) return
    if (!window.turnstile) return
    if (widgetId) return // already rendered
    const id = window.turnstile.render(widgetRef.current!, {
      sitekey: siteKey,
      size: 'compact',
      theme: 'auto',
      action: 'join_waitlist',
    })
    setWidgetId(id || '')
  }, [scriptReady, widgetId])

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
      e.preventDefault()
      setError('')
      const trimmed = email.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        startViewTransition(() => {
          setError('Please enter a valid email address')
          setStatus('error')
        })
        return
      }
      startViewTransition(() => setStatus('loading'))
      try {
        let token = ''
        if (widgetId && window.turnstile) {
          // Execute the invisible widget to obtain a fresh token
          token = await new Promise<string>((resolve) => {
            const div = widgetRef.current
            if (!div || !window.turnstile) return resolve('')
            // Re-render with a callback to capture the token for this action
            const id = window.turnstile.render(div, {
              sitekey: siteKey,
              size: 'invisible' as any,
              theme: 'auto',
              action: 'join_waitlist',
              callback: (tkn: string) => resolve(tkn),
              'error-callback': () => resolve(''),
              'expired-callback': () => resolve(''),
            })
            if (id) {
              window.turnstile.execute(id)
            } else {
              window.turnstile.execute(div)
            }
          })
        }

        const res = await joinWaitlist({ data: { email: trimmed, token } })
        if (res.ok) {
          startViewTransition(() => {
            setStatus('success')
            setEmail('')
          })
        } else {
          startViewTransition(() => {
            setError(res.error || 'Something went wrong')
            setStatus('error')
          })
        }
      } catch (e) {
        startViewTransition(() => {
          setError(e instanceof Error ? e.message : 'Something went wrong')
          setStatus('error')
        })
      }
    },
    [email],
  )

  // No width measuring needed; rely on view transitions to morph layout

  return (
    <div className="inline-flex flex-col items-center">
      <form
        ref={containerRef}
        onSubmit={onSubmit}
        data-state={status}
        className="waitlist-glass group pointer-events-auto relative z-30 inline-flex items-center gap-3 overflow-hidden rounded-full px-3 py-2 shadow-lg"
        aria-live="polite"
      >
        {/* Glass border + inner */}
        <div className={cn("absolute inset-0 rounded-full bg-gradient-to-r from-white/20 via-white/40 to-white/20 opacity-90 transition-all group-hover:opacity-100", status === 'success' && 'bg-teal-600/70 shadow-none')} />
        <div className="absolute inset-[1px] rounded-full bg-white/10 backdrop-blur-xl transition-all group-hover:bg-white/20" />

        {/* Invisible Turnstile widget mount point */}
        <div ref={widgetRef} className="absolute -z-10" />

        {/* Content area using normal flex layout with view transitions */}
        <div className="vt-waitlist relative flex h-[56px] items-center gap-3">
          {status === 'success' ? (
            <div className="vt-waitlist-content flex items-center justify-center gap-3 px-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 font-bold text-black">
                ✓
              </span>
              <span className="text-sm text-white sm:text-base">You’re on the list!</span>
            </div>
          ) : (
            <div className="vt-waitlist-content flex items-center gap-3 px-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@domain.com"
                aria-label="Email address"
                className="min-w-0 flex-1 rounded-full bg-transparent px-4 py-3 text-black/95 placeholder-black/40 outline-none"
                disabled={status === 'loading'}
                required
              />

              {/* Submit button with spinner */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="relative isolate shrink-0 rounded-full bg-white px-5 py-2 font-medium text-black shadow-[0_0_0_0_rgba(255,255,255,0.35)] transition-all duration-300 hover:shadow-[0_0_28px_2px_rgba(255,255,255,0.25)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span
                  className={
                    'inline-flex items-center gap-2 transition-opacity duration-200 ' +
                    (status === 'loading' ? 'opacity-0' : 'opacity-100')
                  }
                >
                  Join the lineup 🤙
                </span>
                {status === 'loading' && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/70 border-t-transparent" />
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Error below glass container */}
      {status !== 'success' && error && (
        <div className="vt-waitlist-error mt-2 text-center text-sm text-rose-100 backdrop-blur-sm bg-rose-600/80 px-4 py-0.5 rounded-full drop-shadow-sm">{error}</div>
      )}
    </div>
  )
}
