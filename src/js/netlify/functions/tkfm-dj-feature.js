// Safe for a .js file or inside <script>...</script>
window.payFeature = async function (mixtapeId, tier) {
  try {
    if (!mixtapeId || !tier) {
      alert("Missing mixtapeId or tier.")
      return
    }

    // Optional: prevent double-clicks if you pass a button id
    // (leave as-is if you don’t use it)
    var btn = document.getElementById("payFeatureBtn")
    if (btn) btn.disabled = true

    var res = await fetch("/.netlify/functions/create-feature-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mixtapeId: String(mixtapeId),
        tier: String(tier).toLowerCase()
      })
    })

    if (!res.ok) {
      var msg = await res.text()
      throw new Error(msg || "Checkout failed")
    }

    var data = await res.json()
    if (!data || !data.url) {
      throw new Error("No checkout URL returned")
    }

    window.location.href = data.url
  } catch (err) {
    console.error("payFeature error:", err)
    alert("Unable to start checkout. Please try again.")
    var btn2 = document.getElementById("payFeatureBtn")
    if (btn2) btn2.disabled = false
  }
}
