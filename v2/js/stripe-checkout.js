document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".js-checkout");
  if (!buttons.length) return;

  const setBusy = (btn, busy, text) => {
    if (busy) {
      btn.classList.add("btn-busy");
      btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
      btn.textContent = text || "Redirecting…";
    } else {
      btn.classList.remove("btn-busy");
      btn.textContent = btn.dataset.originalText || btn.textContent;
    }
  };

  const startCheckout = async ({ plan, feature }, btn) => {
    setBusy(btn, true, "Opening secure checkout…");

    try {
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, feature }),
      });

      const raw = await res.text();

      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        // Non-JSON (404 HTML, etc.)
      }

      if (!res.ok) {
        const msg =
          data?.error ||
          data?.message ||
          `Checkout failed (HTTP ${res.status}). Your Netlify function is not deployed or is misconfigured.`;
        throw new Error(msg);
      }

      if (!data?.url) {
        throw new Error("Checkout failed: no URL returned. Check Netlify function logs and env vars.");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Stripe checkout error:", err);
      setBusy(btn, false);
      alert(err.message || "Checkout failed. Please try again.");
    }
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const plan = btn.dataset.plan || null;
      const feature = btn.dataset.feature || null;
      if (!plan && !feature) return;
      startCheckout({ plan, feature }, btn);
    });
  });
});
