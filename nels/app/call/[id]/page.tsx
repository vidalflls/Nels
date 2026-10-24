'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CallRoom from '@/components/CallRoom'
import { CODE_RE, cleanName, loadName, saveName } from '@/lib/utils'

type Conn = { token: string; url: string }

export default function CallPage() {
  const params = useParams<{ id: string }>()
  const id = (params.id ?? '').toLowerCase()
  const router = useRouter()
  const [name, setName] = useState('')
  const [conn, setConn] = useState<Conn | null>(null)
  const [needName, setNeedName] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function connect(nm: string) {
    setErr(''); setBusy(true)
    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: id, name: nm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível entrar.')
      setConn(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Não foi possível entrar.')
      setNeedName(true)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!CODE_RE.test(id)) { setErr('Código de chamada inválido.'); setNeedName(false); return }
    const saved = loadName()
    if (saved) { setName(saved); connect(saved) } else { setNeedName(true) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (conn) {
    return <CallRoom token={conn.token} url={conn.url} code={id} onLeave={() => router.push('/')} />
  }

  return (
    <main className="lobby">
      <div className="card">
        <h1 className="brand">Nels</h1>
        {!CODE_RE.test(id) ? (
          <>
            <p className="msg error" role="alert">{err}</p>
            <button className="primary wide" onClick={() => router.push('/')}>Voltar ao início</button>
          </>
        ) : needName ? (
          <>
            <p>Você vai entrar na chamada <b className="mono">{id}</b>.</p>
            <input
              className="full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { const n = cleanName(name); saveName(n); connect(n) } }}
              placeholder="Seu nome (opcional)"
              maxLength={20}
              autoFocus
              aria-label="Seu nome"
            />
            <button
              className="primary wide"
              disabled={busy}
              onClick={() => { const n = cleanName(name); saveName(n); connect(n) }}
            >
              {busy ? 'Entrando…' : 'Entrar na chamada'}
            </button>
            <p className="msg error" role="alert">{err}</p>
          </>
        ) : (
          <p>Entrando na chamada…</p>
        )}
      </div>
    </main>
  )
}
