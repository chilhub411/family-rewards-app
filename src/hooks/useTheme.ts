import { useEffect } from 'react'
import { useAppStore } from '../stores/appStore'

export function useTheme() {
  const currentUser = useAppStore(s => s.getCurrentUser())
  const settings = useAppStore(s => s.settings)

  useEffect(() => {
    const pref = currentUser?.themePreference ?? settings.wallTheme ?? 'auto'
    const root = document.documentElement

    if (pref === 'dark') {
      root.classList.add('dark')
    } else if (pref === 'light') {
      root.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    }

    if (currentUser?.accentColor) {
      root.style.setProperty('--accent', currentUser.accentColor)
    }
  }, [currentUser?.themePreference, currentUser?.accentColor, settings.wallTheme])
}
