'use client'
import { useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  isTrackReference,
  useChat,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useTracks,
} from '@livekit/components-react'
import type { TrackReference } from '@livekit/components-react'
import { ConnectionState, Track } from 'livekit-client'
import { MAX_PEOPLE } from '@/lib/utils'

const PRESETS = {
  hd30: { label: '720p · 30 fps', w: 1280, h: 720, fps: 30, bps: 2_500_000 },
  fhd30: { label: '1080p · 30 fps', w: 1920, h: 1080, fps: 30, bps: 5_000_000 },
  fhd60: { label: '1080p · 60 fps', w: 1920, h: 1080, fps: 60, bps: 8_000_000 },
} as const
type PresetKey = keyof typeof PRESETS
type Mode = 'detail' | 'motion'

export default function CallRoom({
  token, url, code, onLeave,
}: { token: string; url: string; code: string; onLeave: () => void }) {
  const [notice, setNotice] = useState('')
  return (
    <LiveKitRoom
      token={token}
      serverUrl={url}
      connect
      audio
      video={false}
      // Sem adaptiveStream: a tela compartilhada chega sempre na qualidade máxima disponível.
      options={{ adaptiveStream: false, dynacast: true }}
      onDisconnected={onLeave}
      onError={(e) => setNotice(e.message)}
      onMediaDeviceFailure={() =>
        setNotice('Microfone indisponível ou bloqueado. Você ainda pode ouvir, compartilhar a tela e usar o chat.')
      }
    >
      <Stage code={code} notice={notice} onLeave={onLeave} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  )
}

function Stage({ code, notice, onLeave }: { code: string; notice: string; onLeave: () => void }) {
  const state = useConnectionState()
  const participants = useParticipants()
  const { localParticipant, isMicrophoneEnabled, isScreenShareEnabled } = useLocalParticipant()
  const screens = useTracks([Track.Source.ScreenShare]).filter(isTrackReference)

  const [quality, setQuality] = useState<PresetKey>('fhd30')
  const [mode, setMode] = useState<Mode>('detail')
  const [info, setInfo] = useState('')
  const [copied, setCopied] = useState(false)

  const total = participants.length
  const status =
    state === ConnectionState.Connected ? { text: `Conectado · ${total}/${MAX_PEOPLE}`, tone: 'ok' }
    : state === ConnectionState.Reconnecting ? { text: 'Reconectando…', tone: 'wait' }
    : state === ConnectionState.Connecting ? { text: 'Conectando…', tone: 'wait' }
    : { text: 'Desconectado', tone: 'bad' }

  async function toggleMic() {
    try { await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled) }
    catch { setInfo('Não foi possível usar o microfone.') }
  }

  async function toggleShare() {
    setInfo('')
    try {
      if (isScreenShareEnabled) { await localParticipant.setScreenShareEnabled(false); return }
      const q = PRESETS[quality]
      await localParticipant.setScreenShareEnabled(
        true,
        {
          audio: true,
          contentHint: mode === 'detail' ? 'detail' : 'motion',
          resolution: { width: q.w, height: q.h, frameRate: q.fps },
        },
        {
          screenShareEncoding: { maxBitrate: q.bps, maxFramerate: q.fps },
          screenShareSimulcastLayers: [],
          degradationPreference: mode === 'detail' ? 'maintain-resolution' : 'maintain-framerate',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      )
    } catch {
      setInfo('Compartilhamento cancelado ou bloqueado pelo navegador.')
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/call/${code}`)
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    } catch { setInfo('Copie o endereço da barra do navegador.') }
  }

  return (
    <div className="call">
      <div className="top">
        <span className="logo">Nels</span>
        <div className="status" data-state={status.tone}>
          <span className="dot" /><span>{status.text}</span>
        </div>
        <div className="people">
          {participants.map((p) => (
            <span key={p.identity} className="chip">{p.name || 'Convidado'}{p.isLocal ? ' (você)' : ''}</span>
          ))}
        </div>
        <div className="codebox">
          <span>Código</span>
          <input className="code-show" readOnly value={code} aria-label="Código da chamada" onFocus={(e) => e.currentTarget.select()} />
          <button onClick={copyLink}>{copied ? 'Link copiado' : 'Copiar link'}</button>
        </div>
      </div>

      {(notice || info) && <div className="notice" role="status">{info || notice}</div>}

      <div className="main">
        <div className="stage">
          <div className="tiles">
            {screens.map((t) => (
              <ScreenTile key={`${t.participant.identity}-${t.publication.trackSid}`} trackRef={t} />
            ))}
          </div>
          {screens.length === 0 && (
            <div className="ph">
              <span>{total <= 1 ? 'Aguardando as outras pessoas entrarem…' : 'Ninguém está compartilhando a tela ainda.'}</span>
            </div>
          )}
        </div>
        <Chat />
      </div>

      <div className="controls">
        <button className={isMicrophoneEnabled ? '' : 'on'} onClick={toggleMic}>
          {isMicrophoneEnabled ? 'Microfone ligado' : 'Microfone mudo'}
        </button>
        <span className="sep" />
        <button className={isScreenShareEnabled ? 'on' : ''} onClick={toggleShare}>
          {isScreenShareEnabled ? 'Parar de compartilhar' : 'Compartilhar tela'}
        </button>
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value as PresetKey)}
          disabled={isScreenShareEnabled}
          aria-label="Qualidade da tela"
        >
          {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
            <option key={k} value={k}>{PRESETS[k].label}</option>
          ))}
        </select>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          disabled={isScreenShareEnabled}
          aria-label="Tipo de conteúdo"
        >
          <option value="detail">Texto e detalhes</option>
          <option value="motion">Movimento (jogos, vídeo)</option>
        </select>
        <span className="sep" />
        <button className="danger" onClick={onLeave}>Sair da chamada</button>
        {isScreenShareEnabled && <div className="outinfo">A qualidade vale ao iniciar. Para mudar, pare e compartilhe de novo.</div>}
      </div>
    </div>
  )
}

function ScreenTile({ trackRef }: { trackRef: TrackReference }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState('')
  const isLocal = trackRef.participant.isLocal

  useEffect(() => {
    let last: { bytes: number; ts: number } | null = null
    const id = setInterval(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const track = trackRef.publication.track as any
        if (!track) return
        const parts: string[] = []
        if (isLocal) {
          const arr = await track.getSenderStats?.()
          const s = Array.isArray(arr) ? arr[0] : arr
          if (!s) return
          parts.push(`Enviando ${s.frameWidth ?? '?'}×${s.frameHeight ?? '?'}`)
          if (s.framesPerSecond != null) parts.push(`${Math.round(s.framesPerSecond)} fps`)
          if (s.qualityLimitationReason && s.qualityLimitationReason !== 'none') {
            parts.push(`limitado por ${s.qualityLimitationReason === 'bandwidth' ? 'banda' : s.qualityLimitationReason === 'cpu' ? 'processador' : s.qualityLimitationReason}`)
          }
        } else {
          const s = await track.getReceiverStats?.()
          if (!s) return
          const w = s.frameWidth ?? s.width, h = s.frameHeight ?? s.height
          if (w && h) parts.push(`${w}×${h}`)
          if (s.framesPerSecond != null) parts.push(`${Math.round(s.framesPerSecond)} fps`)
          if (s.bytesReceived != null && s.timestamp != null) {
            if (last && s.timestamp > last.ts) {
              const mbps = ((s.bytesReceived - last.bytes) * 8) / ((s.timestamp - last.ts) / 1000) / 1e6
              parts.push(`${mbps.toFixed(1)} Mbps`)
            }
            last = { bytes: s.bytesReceived, ts: s.timestamp }
          }
        }
        setStats(parts.join(' · '))
      } catch { /* estatística indisponível neste navegador */ }
    }, 1000)
    return () => clearInterval(id)
  }, [trackRef, isLocal])

  return (
    <div className="tile" ref={rootRef}>
      <VideoTrack trackRef={trackRef} />
      <span className="who-tag">{isLocal ? 'Sua tela' : trackRef.participant.name || 'Convidado'}</span>
      {stats && <span className="tile-stats">{stats}</span>}
      <button className="tile-fs" onClick={() => rootRef.current?.requestFullscreen?.().catch(() => {})}>
        Tela cheia
      </button>
    </div>
  )
}

function Chat() {
  const { chatMessages, send, isSending } = useChat()
  const [text, setText] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [chatMessages.length])

  async function submit() {
    const t = text.trim().slice(0, 500)
    if (!t || isSending) return
    setText('')
    await send(t)
  }

  return (
    <aside className="chat">
      <div className="log" ref={logRef} aria-live="polite">
        {chatMessages.length === 0 && <div className="sys">As mensagens da chamada aparecem aqui.</div>}
        {chatMessages.map((m, i) => {
          const mine = !!m.from?.isLocal
          return (
            <div key={`${m.timestamp}-${i}`} className={`bubble${mine ? ' me' : ''}`}>
              {!mine && <span className="who">{m.from?.name || 'Convidado'}</span>}
              {m.message}
            </div>
          )
        })}
      </div>
      <div className="send">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Mensagem"
          maxLength={500}
          autoComplete="off"
          aria-label="Mensagem"
        />
        <button onClick={submit} disabled={isSending}>Enviar</button>
      </div>
    </aside>
  )
}
