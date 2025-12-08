#!/usr/bin/env node

/**
 * Cross-platform script to kill a process using a specific port
 */

const port = process.argv[2] || process.env.PORT || '3001'
const platform = process.platform

console.log(`🔍 Checking for process on port ${port}...`)

if (platform === 'win32') {
  // Windows PowerShell command
  const { exec } = require('child_process')
  const command = `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`ℹ️  No process found on port ${port} (or already stopped)`)
      process.exit(0)
    } else {
      console.log(`✅ Killed process(es) on port ${port}`)
      process.exit(0)
    }
  })
} else {
  // Unix-like (macOS, Linux)
  const { exec } = require('child_process')
  const command = `lsof -ti :${port} | xargs kill -9 2>/dev/null || true`
  
  exec(command, (error, stdout, stderr) => {
    if (error && error.code !== 0) {
      console.log(`ℹ️  No process found on port ${port} (or already stopped)`)
      process.exit(0)
    } else {
      console.log(`✅ Killed process(es) on port ${port}`)
      process.exit(0)
    }
  })
}

