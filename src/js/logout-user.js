export async function logoutUser() {
  // Call Netlify logout (optional)
  try {
    await fetch('/.netlify/functions/user-logout', { method: 'POST' })
  } catch {
    // ignore
  }

  // Remove tokens (actual logout)
  try {
    localStorage.removeItem('sb-access-token')
    localStorage.removeItem('sb-refresh-token')
    localStorage.removeItem('tkfm_user_token')
  } catch {
    // ignore
  }

  window.location.href = '/'
}
