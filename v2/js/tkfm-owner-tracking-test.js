(() => {
  const $ = (s, r=document) => r.querySelector(s);

  function ownerKey() {
    return (
      localStorage.getItem('TKFM_OWNER_KEY') ||
      localStorage.getItem('tkfm_owner_key') ||
      localStorage.getItem('tkfmOwnerKey') ||
      ''
    ).trim();
  }

  function showMsg(text, mode='info') {
    const box = $('#msg');
    box.style.display = 'block';
    box.textContent = text;
    box.style.borderColor = mode==='err' ? 'rgba(236,72,153,.55)' : 'rgba(34,211,238,.35)';
  }

  function setOut(obj) {
    $('#out').textContent = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
  }

  function ensureId() {
    const v = String($('#fid').value || '').trim();
    if (!v) {
      const gen = 'tkfm_test_' + Date.now().toString(36);
      $('#fid').value = gen;
      return gen;
    }
    return v;
  }

  async function postEvent(ev) {
    const id = ensureId();
    const res = await fetch('/.netlify/functions/featured-media-track', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ id, event: ev })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      showMsg(data.error || 'track failed', 'err');
      setOut(data);
      return;
    }
    showMsg('Sent ' + ev + ' for ' + id, 'info');
  }

  async function loadStats() {
    const id = ensureId();
    const k = ownerKey();
    if (!k) { showMsg('Missing owner key. Login owner first.', 'err'); return; }

    const res = await fetch('/.netlify/functions/featured-media-stats-admin', {
      method:'GET',
      headers:{ 'x-tkfm-owner-key': k }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) { showMsg(data.error || 'stats load failed', 'err'); setOut(data); return; }

    const stats = data.stats || [];
    const hit = stats.find(x => String(x.id||'') === id) || null;

    if (!hit) {
      showMsg('No stats found for id (send an event first)', 'err');
      setOut({ id, found: false, totalStats: stats.length });
      return;
    }

    showMsg('Loaded stats for ' + id, 'info');
    setOut(hit);
  }

  $('#impBtn').addEventListener('click', () => postEvent('impression'));
  $('#clkBtn').addEventListener('click', () => postEvent('click'));
  $('#loadBtn').addEventListener('click', loadStats);

  // default id
  ensureId();
})();
