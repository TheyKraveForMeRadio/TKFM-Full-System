(() => {
  // TKFM: Rotation Boost Submit Page
  // Requires ?session_id=... from Stripe success_url

  function $(sel, root = document) { return root.querySelector(sel); }

  function qs(name) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name) || '';
  }

  function normalizeUrl(v) {
    let s = String(v || '').trim();
    if (!s) return '';
    if (!/^https?:\/\//i.test(s) && /^[a-z0-9.-]+\.[a-z]{2,}/i.test(s)) s = 'https://' + s;
    return s;
  }

  function setStatus(text, ok = null) {
    const el = $('#status');
    el.textContent = text;
    el.className = 'tag ' + (ok === true ? 'tagOk' : ok === false ? 'tagBad' : '');
  }

  async function verify(sessionId) {
    const res = await fetch('/.netlify/functions/boost-session-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Verify failed' };
    return data;
  }

  async function submit(sessionId, title, url) {
    const res = await fetch('/.netlify/functions/rotation-boost-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, title, url })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) return { ok: false, error: data.error || 'Submit failed' };
    return data;
  }

  async function boot() {
    const sessionId = qs('session_id');
    if (!sessionId) {
      setStatus('Missing session_id (checkout success URL not detected)', false);
      return;
    }

    setStatus('Verifying payment…', null);
    const v = await verify(sessionId);
    if (!v.ok || !v.paid || v.lane !== 'rotation_boost') {
      setStatus('Payment not verified yet', false);
      return;
    }

    $('#plan').textContent = v.planId || 'rotation_boost';
    setStatus('Paid ✅ Ready to submit', true);

    $('#submitBtn').addEventListener('click', async (e) => {
      e.preventDefault();

      const title = String($('#title').value || '').trim();
      const url = normalizeUrl($('#url').value);

      if (!url) { setStatus('Paste a URL to boost', false); return; }

      $('#submitBtn').disabled = true;
      setStatus('Submitting…', null);

      const r = await submit(sessionId, title || 'Rotation Boost', url);

      $('#submitBtn').disabled = false;

      if (!r.ok) { setStatus(r.error || 'Submit failed', false); return; }

      setStatus('LIVE ✅ Boost is active', true);
      $('#done').style.display = 'block';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
