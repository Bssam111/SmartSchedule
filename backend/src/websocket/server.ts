import { WebSocketServer, WebSocket } from 'ws'
import * as Y from 'yjs'

const PORT = process.env.WS_PORT || 3002

export function createWebSocketServer() {
  const wss = new WebSocketServer({ 
    port: parseInt(String(PORT)),
    perMessageDeflate: false // Disable compression for better performance
  })

  wss.on('connection', (ws: WebSocket, req: any) => {
    console.log('🔌 WebSocket connection established')
    
    try {
      // Create a Y.Doc for this connection
      const doc = new Y.Doc()
      
      // Handle messages
      ws.on('message', (message: Buffer) => {
        try {
          Y.applyUpdate(doc, message)
        } catch (error: any) {
          console.error('❌ Error applying Y.js update:', error)
        }
      })

      // Send updates to client
      doc.on('update', (update: Uint8Array) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(update)
        }
      })
    } catch (error: any) {
      console.error('❌ Error setting up WebSocket connection:', error)
      ws.close()
      return
    }

    ws.on('error', (error: Error) => {
      console.error('❌ WebSocket error:', error)
    })

    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed')
    })
  })

  console.log(`🚀 WebSocket server running on port ${PORT}`)
  console.log(`📡 Ready for real-time collaboration`)
  return wss
}

