(() => {
  const THEME_BG = '#020617';
  const NEON_PURPLE = '#a855f7';
  const NEON_PINK = '#ec4899';
  const NEON_CYAN = '#22d3ee';
  const NEON_BLUE = '#3b82f6';

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function safeText(s) {
    return (s == null ? '' : String(s)).replace(/[<>]/g, '').trim();
  }

  function getLastLane() {
    const fromLS =
      localStorage.getItem('tkfm_last_plan') ||
      localStorage.getItem('tkfm_last_lane') ||
      localStorage.getItem('tkfm_last_purchase') ||
      '';
    return String(fromLS || '').trim();
  }

  function createModal() {
    if (qs('#tkfmPaidLaneModal')) return;

    const wrap = document.createElement('div');
    wrap.id = 'tkfmPaidLaneModal';
    wrap.style.cssText = [
      'position:fixed',
      'inset:0',
      'display:none',
      'align-items:center',
      'justify-content:center',
      'z-index:99999',
      'padding:18px',
      'background:rgba(0,0,0,.72)',
      'backdrop-filter: blur(6px)'
    ].join(';');

    const card = document.createElement('div');
    card.style.cssText = [
      `background:${THEME_BG}`,
      'border:1px solid rgba(168,85,247,.45)',
      'border-radius:16px',
      'width:min(720px, 96vw)',
      'box-shadow: 0 0 0 1px rgba(34,211,238,.15), 0 22px 80px rgba(0,0,0,.65)',
      'padding:18px'
    ].join(';');

    card.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div>
          <div style="font-size:18px;font-weight:800;letter-spacing:.2px;color:white">Submit Your Paid Lane Request</div>
          <div id="tkfmLaneLabel" style="margin-top:4px;font-size:12px;color:rgba(255,255,255,.75)"></div>
        </div>
        <button id="tkfmPaidLaneClose" type="button"
          style="background:transparent;border:1px solid rgba(255,255,255,.18);color:white;border-radius:10px;padding:8px 10px;cursor:pointer">
          Close
        </button>
      </div>

      <div id="tkfmPaidLaneMsg" style="margin-top:12px;display:none;padding:10px;border-radius:12px;border:1px solid rgba(34,211,238,.35);color:white"></div>

      <form id="tkfmPaidLaneForm" style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <input id="tkfmPLName" placeholder="Your name / stage name" autocomplete="name"
          style="grid-column:1/-1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:white;padding:12px" />

        <input id="tkfmPLEmail" placeholder="Email" autocomplete="email"
          style="grid-column:1/-1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:white;padding:12px" />

        <input id="tkfmPLLinks" placeholder="Links (Spotify/Apple/SoundCloud/YouTube/Drive) — paste all"
          style="grid-column:1/-1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:white;padding:12px" />

        <textarea id="tkfmPLNotes" rows="5" placeholder="Notes: what you purchased + what you want done + any deadlines"
          style="grid-column:1/-1;resize:vertical;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:white;padding:12px"></textarea>

        <button id="tkfmPLSubmit" type="submit"
          style="grid-column:1/-1;background:linear-gradient(90deg, ${NEON_PURPLE}, ${NEON_PINK}, ${NEON_CYAN});border:none;color:white;border-radius:12px;padding:12px 14px;font-weight:800;cursor:pointer">
          Submit to TKFM
        </button>

        <div style="grid-column:1/-1;font-size:12px;color:rgba(255,255,255,.65);line-height:1.35">
          This form sends your request into the TKFM Owner Inbox (no redirects, no broken flow).
        </div>
      </form>
    `;

    wrap.appendChild(card);
    document.body.appendChild(wrap);

    const close = qs('#tkfmPaidLaneClose', wrap);
    close.addEventListener('click', () => hide());

    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) hide();
    });

    const form = qs('#tkfmPaidLaneForm', wrap);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submit();
    });
  }

  function showMsg(msg, mode = 'info') {
    const box = qs('#tkfmPaidLaneMsg');
    if (!box) return;
    box.style.display = 'block';
    box.textContent = msg;

    const border = mode === 'ok'
      ? 'rgba(34,211,238,.45)'
      : mode === 'err'
        ? 'rgba(236,72,153,.55)'
        : 'rgba(59,130,246,.45)';

    box.style.borderColor = border;
  }

  function setLaneLabel(laneId) {
    const el = qs('#tkfmLaneLabel');
    if (!el) return;
    el.textContent = laneId ? `Lane: ${laneId}` : 'Lane: (not set)';
  }

  let currentLaneId = '';

  function show(laneId = '') {
    createModal();
    currentLaneId = String(laneId || getLastLane() || '').trim();
    setLaneLabel(currentLaneId);

    const wrap = qs('#tkfmPaidLaneModal');
    if (!wrap) return;

    wrap.style.display = 'flex';

    // reset message each open
    const msg = qs('#tkfmPaidLaneMsg');
    if (msg) msg.style.display = 'none';

    // prefill from storage
    const name = localStorage.getItem('tkfm_name') || '';
    const email = localStorage.getItem('tkfm_email') || '';
    const n = qs('#tkfmPLName'); if (n && !n.value) n.value = name;
    const em = qs('#tkfmPLEmail'); if (em && !em.value) em.value = email;
  }

  function hide() {
    const wrap = qs('#tkfmPaidLaneModal');
    if (!wrap) return;
    wrap.style.display = 'none';
  }

  async function submit() {
    const btn = qs('#tkfmPLSubmit');
    if (!btn) return;

    const name = safeText(qs('#tkfmPLName')?.value || '');
    const email = safeText(qs('#tkfmPLEmail')?.value || '');
    const links = safeText(qs('#tkfmPLLinks')?.value || '');
    const notes = safeText(qs('#tkfmPLNotes')?.value || '');
    const laneId = safeText(currentLaneId || '');

    if (!laneId) return showMsg('Missing lane id — refresh and try again after purchase.', 'err');
    if (!name && !email) return showMsg('Add name or email.', 'err');

    // keep quick data for future autofill
    if (name) localStorage.setItem('tkfm_name', name);
    if (email) localStorage.setItem('tkfm_email', email);

    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
      const res = await fetch('/.netlify/functions/paid-lane-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laneId,
          planId: laneId,
          name,
          email,
          links,
          notes
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        showMsg(data.error || 'Submit failed.', 'err');
      } else {
        localStorage.setItem('tkfm_last_submission_id', data.id || '');
        showMsg('Submitted. TKFM will review and activate your placement.', 'ok');
        btn.textContent = 'Submitted ✅';
        setTimeout(() => hide(), 900);
        return;
      }
    } catch (e) {
      showMsg('Network error. Try again.', 'err');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit to TKFM';
    }
  }

  function bindTriggers() {
    document.addEventListener('click', (e) => {
      const el = e.target?.closest?.('[data-open-paid-lane="1"],[data-open-paid-lane="true"],[data-open-paid-lane="yes"]');
      if (!el) return;

      const lane = el.getAttribute('data-lane') || el.getAttribute('data-plan') || el.getAttribute('data-feature') || '';
      show(lane);
    });

    // Auto-open support for post-checkout: ?open_paid_lane=1&lane=...
    const u = new URL(window.location.href);
    const open = u.searchParams.get('open_paid_lane') || '';
    const lane = u.searchParams.get('lane') || u.searchParams.get('plan') || '';

    if (String(open).trim() === '1') {
      setTimeout(() => show(lane), 300);
    }
  }

  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        bindTriggers();
        createModal();
      });
    } else {
      bindTriggers();
      createModal();
    }
  }

  boot();
})();
