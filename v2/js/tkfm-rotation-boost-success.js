(() => {
  // TKFM: Rotation Boost Success
  // Polls activation status until webhook posts to Featured.
  function $(s, r=document){ return r.querySelector(s); }
  function qs(name){ return new URL(window.location.href).searchParams.get(name) || ''; }

  function setStatus(text, ok=null){
    const el = $('#status');
    el.textContent = text;
    el.className = 'tag ' + (ok === true ? 'tagOk' : ok === false ? 'tagBad' : '');
  }

  async function poll(sessionId){
    const res = await fetch('/.netlify/functions/boost-activation-status', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    const data = await res.json().catch(()=>({}));
    if (!res.ok || !data.ok) return { ok:false, error: data.error || 'Status failed' };
    return data;
  }

  async function boot(){
    const sessionId = qs('session_id');
    if (!sessionId){ setStatus('Missing session_id', false); return; }

    $('#sid').textContent = sessionId;
    setStatus('Payment received — activating boost…', null);

    let tries = 0;
    const maxTries = 30; // ~60s at 2s interval

    const tick = async () => {
      tries++;
      const s = await poll(sessionId);

      if (s.ok && s.paid && s.activated) {
        setStatus('LIVE ✅ Your boost is active', true);
        $('#plan').textContent = s.planId || 'rotation_boost';
        $('#until').textContent = (s.boostUntil || '').replace('T',' ').replace('Z','');
        $('#done').style.display = 'block';
        return;
      }

      if (tries >= maxTries) {
        setStatus('Still processing… open radio (may take another minute)', false);
        $('#done').style.display = 'block';
        return;
      }

      setStatus('Activating… (' + tries + '/' + maxTries + ')', null);
      setTimeout(tick, 2000);
    };

    tick();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
