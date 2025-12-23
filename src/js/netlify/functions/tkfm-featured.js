document.addEventListener("DOMContentLoaded", async function () {
  try {
    var container = document.getElementById("mixtapes")
    if (!container) return

    var res = await fetch("/.netlify/functions/public-get-mixtapes")
    if (!res.ok) throw new Error("Failed to load mixtapes")

    var data = await res.json()

    // Support either: [ ... ] OR { ok:true, items:[ ... ] }
    var mixtapes = Array.isArray(data) ? data : (data && data.items ? data.items : [])
    if (!Array.isArray(mixtapes)) mixtapes = []

    var now = Date.now()

    // FEATURED ACTIVE FIRST (based on featureExpiresAt)
    mixtapes.sort(function (a, b) {
      var aActive = a && a.featured === true && Number(a.featureExpiresAt) > now
      var bActive = b && b.featured === true && Number(b.featureExpiresAt) > now
      if (aActive && !bActive) return -1
      if (!aActive && bActive) return 1
      // secondary sort: views desc if present
      var av = Number(a && a.featuredViews) || 0
      var bv = Number(b && b.featuredViews) || 0
      return bv - av
    })

    container.innerHTML = mixtapes
      .map(function (m) {
        m = m || {}
        var expiresAt = Number(m.featureExpiresAt) || 0
        var featuredActive = m.featured === true && expiresAt > now

        var title = escapeHtml(m.title || "Untitled")
        var artist = escapeHtml(m.artist || m.djName || m.dj || "")
        var audioUrl = m.audioUrl || ""

        return (
          '<div class="mixtape-card ' + (featuredActive ? "featured" : "") + '">' +
            (featuredActive ? '<div class="badge">🔥 FEATURED</div>' : "") +
            "<h3>" + title + "</h3>" +
            (artist ? "<p>" + artist + "</p>" : "") +
            (featuredActive
              ? '<p class="countdown" data-expire="' + expiresAt + '">⏳ Loading countdown…</p>'
              : "") +
            (audioUrl
              ? '<audio controls src="' + escapeAttr(audioUrl) + '"></audio>'
              : "<p>No audio available.</p>") +
          "</div>"
        )
      })
      .join("")

    startCountdowns()
  } catch (err) {
    console.error("Mixtapes render error:", err)
  }
})

function startCountdowns() {
  var timers = document.querySelectorAll(".countdown")
  if (!timers || !timers.length) return

  function tick() {
    var now = Date.now()
    timers.forEach(function (el) {
      var expire = Number(el.dataset.expire) || 0
      var diff = expire - now

      if (diff <= 0) {
        el.textContent = "⏳ Feature expired"
        return
      }

      var days = Math.floor(diff / 86400000)
      var hrs = Math.floor((diff % 86400000) / 3600000)
      var mins = Math.floor((diff % 3600000) / 60000)

      el.textContent = "⏳ " + days + "d " + hrs + "h " + mins + "m left"
    })
  }

  tick() // ✅ run immediately
  setInterval(tick, 60000)
}

// --- tiny sanitizers (prevents broken HTML / injection) ---
function escapeHtml(str) {
  str = String(str || "")
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/`/g, "&#096;")
}
