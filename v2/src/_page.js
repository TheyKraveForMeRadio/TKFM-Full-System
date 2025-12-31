// src/_page.js
// Shared shell logic for TKFM v2 pages.
// This satisfies: import { mountShell } from '/src/_page.js'

export function mountShell(pageId) {
  try {
    // Optional: mark that the shell mounted
    document.documentElement.classList.add('tkfm-shell-ready')

    // Highlight nav items if you use data-page-link attributes
    if (pageId) {
      const links = document.querySelectorAll('[data-page-link]')
      links.forEach(link => {
        const isActive = link.dataset.pageLink === pageId
        link.classList.toggle('tkfm-nav-active', isActive)
      })
    }

    // Simple dark/light toggle support if present
    const toggle = document.querySelector('[data-toggle-theme]')
    if (toggle && !toggle.dataset._tkfmBound) {
      toggle.dataset._tkfmBound = '1'

      toggle.addEventListener('click', () => {
        const html = document.documentElement
        const mode = html.dataset.theme === 'light' ? 'dark' : 'light'
        html.dataset.theme = mode
        try {
          localStorage.setItem('tkfm-theme', mode)
        } catch (_) {}
      })

      // restore last theme
      try {
        const saved = localStorage.getItem('tkfm-theme')
        if (saved === 'light' || saved === 'dark') {
          document.documentElement.dataset.theme = saved
        }
      } catch (_) {}
    }
  } catch (err) {
    console.error('[TKFM] mountShell error:', err)
  }
}
