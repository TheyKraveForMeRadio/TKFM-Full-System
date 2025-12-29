// 🟣 LOGO FALLBACK SYSTEM
function checkLogo(path, placeholder) {
  const img = new Image()
  img.src = path
  img.onload = () => console.log(`✔ ${path} loaded`)
  img.onerror = () => {
    document.querySelectorAll(`img[src="${path}"]`).forEach(i => i.src = placeholder)
    console.warn(`❌ Missing: ${path} → placeholder applied`)
  }
}

checkLogo('/tkfm-radio-logo.png', 'https://via.placeholder.com/200x80?text=TKFM+Radio+Logo+Missing')
checkLogo('/tkfm-records-logo.png', 'https://via.placeholder.com/200x80?text=TKFM+Records+Logo+Missing')
