#!/usr/bin/env node

const { execSync } = require('child_process')

const rawPort = process.argv[2] || '5000'
const port = Number(rawPort)

if (!Number.isInteger(port) || port <= 0) {
  console.error(`[free-port] Invalid port: ${rawPort}`)
  process.exit(1)
}

function unique(values) {
  return [...new Set(values)]
}

function freePortOnWindows(targetPort) {
  let output = ''

  try {
    output = execSync(`netstat -ano -p tcp | findstr :${targetPort}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return
  }

  const pids = unique(
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\s+/).pop())
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
  )

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: ['ignore', 'ignore', 'ignore'] })
      console.log(`[free-port] Stopped PID ${pid} on port ${targetPort}`)
    } catch {
      // Ignore race conditions where process exits between detection and kill.
    }
  }
}

function freePortOnUnix(targetPort) {
  let output = ''

  try {
    output = execSync(`lsof -ti:${targetPort}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return
  }

  const pids = unique(
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
  )

  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGKILL')
      console.log(`[free-port] Stopped PID ${pid} on port ${targetPort}`)
    } catch {
      // Ignore race conditions and permission issues.
    }
  }
}

if (process.platform === 'win32') {
  freePortOnWindows(port)
} else {
  freePortOnUnix(port)
}
