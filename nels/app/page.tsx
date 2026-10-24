'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CODE_RE, MAX_PEOPLE, cleanName, loadName, newCode, saveName } from '@/lib/utils'

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => { setName(loadName()) }, [])

  function go(c: string) {
    const clean = c.trim().toLowerCase()
    if (!CODE_RE.test(clean)) { setMsg('O código tem 6 letras ou números.'); return }
    saveName(cleanName(name))
    router.push(`/call/${clean}`)
  }

  return (
    <main className="lobby">
      <div className="card">
        <h1 className="brand">Nels</h1>
        <p>Chamadas de até {MAX_PEOPLE} pessoas, com compartilhamento de tela e chat.</p>
        <input
          className="full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome (opcional)"
          maxLength={20}
          autoComplete="off"
          aria-label="Seu nome"
        />
        <button className="primary wide" onClick={() => go(newCode())}>Criar chamada</button>
        <div className="or">ou entre com um código</div>
        <div className="row">
          <input
            className="code-in"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go(code)}
            placeholder="Código de 6 letras"
            maxLength={6}
            autoComplete="off"
            spellCheck={false}
            aria-label="Código da chamada"
          />
          <button onClick={() => go(code)}>Entrar</button>
        </div>
        <p className="msg" role="status">{msg}</p>
      </div>
    </main>
  )
}
