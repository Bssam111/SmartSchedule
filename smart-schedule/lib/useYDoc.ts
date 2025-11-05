'use client'

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useEffect, useMemo, useRef, useState } from 'react'

export function useYDoc(roomId: string) {
  const doc = useMemo(() => new Y.Doc(), [])
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')
  const providerRef = useRef<WebsocketProvider | null>(null)

  useEffect(() => {
    const provider = new WebsocketProvider(
      'ws://localhost:1234',   // نعدّلها بعد شوي للسيرفر الفعلي
      roomId,
      doc
    )

    providerRef.current = provider
    provider.on('status', e => setStatus(e.status))

    return () => provider.destroy()
  }, [roomId, doc])

  return { doc, status, awareness: providerRef.current?.awareness }
}
