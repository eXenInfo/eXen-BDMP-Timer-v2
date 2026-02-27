const KEYS = {
  DISCIPLINES: 'exen_disciplines',
  ACTIVE_DISCIPLINE: 'exen_active_discipline',
  VOLUME: 'exen_volume',
  ONBOARDING_DONE: 'exen_onboarding_done',
}

export function loadFromStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(KEYS[key] ?? key)
    return raw !== null ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(KEYS[key] ?? key, JSON.stringify(value))
  } catch (e) {
    console.warn('Storage error:', e)
  }
}

export function removeFromStorage(key) {
  localStorage.removeItem(KEYS[key] ?? key)
}

export { KEYS }
