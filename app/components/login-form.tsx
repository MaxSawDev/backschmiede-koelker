// app/components/login-form.tsx
"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { useEffect, useMemo, useState, type FormEvent } from "react"

type LoginState = {
  locked: boolean
  retryAfterSec: number
  failCount: number
  failWindowSecLeft: number
  maxFailures: number
}

async function fetchLoginState(username: string): Promise<LoginState> {
  const res = await fetch("/api/auth/login-state", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  })

  if (!res.ok) {
    return { locked: false, retryAfterSec: 0, failCount: 0, failWindowSecLeft: 0, maxFailures: 5 }
  }

  return res.json()
}

export default function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [err, setErr] = useState<string | null>(null)
  const [lockedSec, setLockedSec] = useState<number>(0)

  const isLocked = lockedSec > 0

  // Countdown
  useEffect(() => {
    if (!isLocked) return
    const t = setInterval(() => {
      setLockedSec((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [isLocked])

  const waitText = useMemo(() => {
    const m = Math.ceil(lockedSec / 60)
    if (lockedSec <= 0) return null
    return `Zu viele Fehlversuche. Bitte warte noch ca. ${m} Minute(n).`
  }, [lockedSec])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErr(null)

    const u = username.trim()
    if (!u) {
      setErr("Bitte Benutzername eingeben.")
      return
    }

    setLoading(true)

    // 1) vor dem Login prüfen: schon gelockt?
    const pre = await fetchLoginState(u)
    if (pre.locked) {
      setLockedSec(pre.retryAfterSec)
      setLoading(false)
      return
    }

    // 2) signIn versuchen
    const res = await signIn("credentials", {
      redirect: false,
      username: u,
      password,
      callbackUrl: "/admin",
    })

    // 3) Wenn Fehler: nochmal Status holen (count/lock anzeigen)
    if (res?.error) {
      const post = await fetchLoginState(u)

      if (post.locked) {
        setLockedSec(post.retryAfterSec)
        setErr(null)
      } else {
        setErr("Ungültige Anmeldedaten.")
      }

      setLoading(false)
      return
    }

    setLoading(false)
    router.replace("/admin")
    router.refresh()
  }

  return (
    <form
      className="w-full max-w-sm space-y-4 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-white/5 backdrop-blur p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <h1 className="text-2xl font-semibold">Admin Login</h1>

      <input
        className="border p-2 rounded w-full bg-white dark:bg-zinc-800"
        placeholder="Benutzername"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        disabled={loading}
      />

      <div className="relative">
        <input
          className="border p-2 pr-10 rounded w-full bg-white dark:bg-zinc-800"
          type={showPassword ? "text" : "password"}
          placeholder="Passwort"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((value) => !value)}
          disabled={loading}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {waitText && <p className="text-sm text-amber-700">{waitText}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      <button
        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-4 py-2 w-full disabled:opacity-60"
        type="submit"
        disabled={loading || isLocked}
      >
        {isLocked ? "Bitte warten…" : loading ? "Anmelden…" : "Anmelden"}
      </button>
    </form>
  )
}
