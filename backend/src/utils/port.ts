import { Server } from 'node:http'
import net from 'node:net'

/**
 * Check if a port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    
    server.listen(port, () => {
      server.once('close', () => resolve(true))
      server.close()
    })
    
    server.on('error', () => {
      resolve(false)
    })
  })
}

/**
 * Find the next available port starting from the given port
 */
export async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i
    const available = await isPortAvailable(port)
    if (available) {
      return port
    }
  }
  
  // If no port found, use 0 (OS-assigned)
  return 0
}

/**
 * Start server with port conflict handling
 */
export async function startServerWithPortFallback(
  server: Server,
  desiredPort: number,
  host: string,
  onSuccess: (actualPort: number) => void
): Promise<void> {
  let actualPort = desiredPort
  
  // Check if desired port is available (only for localhost, skip check for 0.0.0.0 in Docker)
  if (host === 'localhost' || host === '127.0.0.1') {
    const available = await isPortAvailable(desiredPort)
    
    if (!available) {
      console.warn(`⚠️  Port ${desiredPort} is already in use. Looking for alternative...`)
      
      // Try next ports
      const alternativePort = await findAvailablePort(desiredPort + 1, 5)
      
      if (alternativePort === 0) {
        console.warn(`⚠️  No available ports found. Using OS-assigned port.`)
        actualPort = 0
      } else {
        console.log(`✅ Found available port: ${alternativePort}`)
        actualPort = alternativePort
      }
    }
  }
  
  return new Promise((resolve, reject) => {
    server.listen(actualPort, host, () => {
      const address = server.address()
      const finalPort = typeof address === 'object' && address ? address.port : actualPort
      
      onSuccess(finalPort)
      resolve()
    })
    
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        // Try next port
        findAvailablePort(actualPort + 1, 5).then((nextPort) => {
          if (nextPort === 0) {
            server.listen(0, host, () => {
              const address = server.address()
              const finalPort = typeof address === 'object' && address ? address.port : 0
              onSuccess(finalPort)
              resolve()
            })
          } else {
            server.listen(nextPort, host, () => {
              onSuccess(nextPort)
              resolve()
            })
          }
        })
      } else {
        reject(error)
      }
    })
  })
}

