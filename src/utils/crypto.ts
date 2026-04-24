export function hashPin(pin: string): string {
  // Simple hash for PIN — in production use a proper KDF
  let hash = 0
  const salt = 'kudos-family-2024'
  const str = pin + salt
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}

export function verifyPin(pin: string, hash: string): boolean {
  return hashPin(pin) === hash
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
