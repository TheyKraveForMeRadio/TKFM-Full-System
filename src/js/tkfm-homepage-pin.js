// 🔒 ENTERPRISE SAFE LOAD — Homepage Pin
(async () => {
  try {
    await import('./js/tkfm-homepage-pin.js')
  } catch {
    // silent fail — homepage continues to work
  }
})()

