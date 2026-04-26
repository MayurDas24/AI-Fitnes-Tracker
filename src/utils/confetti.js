const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#22c55e', '#f59e0b']

const spawnParticles = ({ count = 80, duration = 1800, spread = 180 }) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.inset = '0'
  container.style.pointerEvents = 'none'
  container.style.zIndex = '9999'
  document.body.appendChild(container)

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    const angle = ((Math.random() * spread) - spread / 2) * (Math.PI / 180)
    const distance = 280 + Math.random() * 420
    const x = Math.cos(angle) * distance
    const y = Math.sin(angle) * distance
    const size = 4 + Math.random() * 8

    p.style.position = 'absolute'
    p.style.left = `${50 + (Math.random() * 20 - 10)}%`
    p.style.top = `${45 + (Math.random() * 20 - 10)}%`
    p.style.width = `${size}px`
    p.style.height = `${size}px`
    p.style.borderRadius = '999px'
    p.style.background = COLORS[Math.floor(Math.random() * COLORS.length)]
    p.style.opacity = '1'
    p.style.transform = 'translate(0,0) rotate(0deg)'
    p.style.transition = `transform ${duration}ms cubic-bezier(0.2,0.7,0.1,1), opacity ${duration}ms ease-out`

    container.appendChild(p)

    requestAnimationFrame(() => {
      p.style.transform = `translate(${x}px, ${y}px) rotate(${Math.random() * 720 - 360}deg)`
      p.style.opacity = '0'
    })
  }

  window.setTimeout(() => {
    container.remove()
  }, duration + 100)
}

export const celebrateAchievement = () => {
  const bursts = [
    { count: 70, duration: 1800, spread: 220 },
    { count: 60, duration: 2000, spread: 260 },
    { count: 50, duration: 2200, spread: 300 },
  ]

  bursts.forEach((cfg, i) => {
    window.setTimeout(() => spawnParticles(cfg), i * 280)
  })
}

export const fireworksEffect = () => {
  const repeats = 10
  for (let i = 0; i < repeats; i++) {
    window.setTimeout(() => {
      spawnParticles({ count: 90, duration: 1800, spread: 360 })
    }, i * 400)
  }
}

export const quickCelebration = () => {
  spawnParticles({ count: 70, duration: 1300, spread: 140 })
}
