import { WebSocketServer, WebSocket } from 'ws'
import * as Y from 'yjs'
import { setupWSConnection } from 'y-websocket'

const PORT = process.env.WS_PORT || 3002

export function createWebSocketServer() {
  const wss = new WebSocketServer({ 
    port: parseInt(String(PORT)),
    perMessageDeflate: false // Disable compression for better performance
  })

  wss.on('connection', (ws: WebSocket, req: any) => {
    console.log('🔌 WebSocket connection established')
    
    try {
      // Use y-websocket's built-in setup function
      setupWSConnection(ws, req)
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

