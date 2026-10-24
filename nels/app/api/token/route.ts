import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'
import { NextRequest, NextResponse } from 'next/server'
import { CODE_RE, MAX_PEOPLE, cleanName } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return NextResponse.json({ error: 'Servidor sem as chaves do LiveKit.' }, { status: 500 })
  }

  let body: { room?: unknown; name?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 }) }

  const room = typeof body.room === 'string' ? body.room.toLowerCase() : ''
  if (!CODE_RE.test(room)) {
    return NextResponse.json({ error: 'O código tem 6 letras ou números.' }, { status: 400 })
  }
  const typed = typeof body.name === 'string' ? cleanName(body.name) : ''
  const name = typed || `Convidado ${10 + Math.floor(Math.random() * 90)}`

  const svc = new RoomServiceClient(LIVEKIT_URL.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:'), LIVEKIT_API_KEY, LIVEKIT_API_SECRET)

  // Sala cheia? (a sala pode ainda não existir: nesse caso conta como vazia)
  const atuais = await svc.listParticipants(room).catch(() => [])
  if (atuais.length >= MAX_PEOPLE) {
    return NextResponse.json({ error: `Esta chamada já tem ${MAX_PEOPLE} pessoas.` }, { status: 409 })
  }
  await svc.createRoom({ name: room, maxParticipants: MAX_PEOPLE, emptyTimeout: 60 * 5 })

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: crypto.randomUUID(),
    name,
    ttl: '3h',
  })
  at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true })

  return NextResponse.json({ token: await at.toJwt(), url: LIVEKIT_URL })
}
