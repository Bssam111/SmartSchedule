// realtime-server.js
const http = require('http')
const express = require('express')
const { WebSocketServer } = require('ws')

// ⬇️ هذا هو التصدير الرسمي الجديد في y-websocket (الإصدارات الحديثة)
const { setupWSConnection } = require('y-websocket')

// إعداد سيرفر بسيط Express + WebSocket
const app = express()
app.get('/healthz', (_, res) => res.json({ ok: true }))

const server = http.createServer(app)
const wss = new WebSocketServer({ server })

wss.on('connection', (ws, req) => {
  // تحديد اسم الغرفة بناءً على المسار بعد "/"
  const room = (req.url || '/default').slice(1) || 'default'
  setupWSConnection(ws, req, { docName: room })
})

const PORT = process.env.RTC_PORT ? Number(process.env.RTC_PORT) : 1234
server.listen(PORT, () => {
  console.log(`✅ Yjs websocket server running at ws://localhost:${PORT}`)
})
