// Podcaster Dashboard (Monthly members only)
// Requires: js/tkfm-subscription-guard.js (client check) and server functions for save/get.

(function(){
  const REQUIRED = ['video_creator_pass_monthly'];
  const LS_EMAIL = 'tkfm_customer_email';

  const $ = (id) => document.getElementById(id);

  function msg(text, ok){
    const el = $('msg');
    el.textContent = text || '';
    el.className = ok ? 'mt-4 text-sm font-semibold text-emerald-300' : 'mt-4 text-sm font-semibold text-red-300';
  }

  function setPublicUrl(slug){
    const origin = window.location.origin;
    const url = origin + '/podcaster-show?slug=' + encodeURIComponent(slug);
    $('publicUrl').value = url;
  }

  function fill(profile){
    $('slug').value = profile.slug || '';
    $('showName').value = profile.showName || '';
    $('hostName').value = profile.hostName || '';
    $('category').value = profile.category || '';
    $('bio').value = profile.bio || '';
    $('coverUrl').value = profile.coverUrl || '';
    $('website').value = profile.website || '';
    $('youtube').value = profile.youtube || '';
    $('spotify').value = profile.spotify || '';
    if (profile.slug) setPublicUrl(profile.slug);
  }

  function readForm(){
    return {
      slug: $('slug').value.trim(),
      showName: $('showName').value.trim(),
      hostName: $('hostName').value.trim(),
      category: $('category').value.trim(),
      bio: $('bio').value.trim(),
      coverUrl: $('coverUrl').value.trim(),
      website: $('website').value.trim(),
      youtube: $('youtube').value.trim(),
      spotify: $('spotify').value.trim(),
    };
  }

  async function gate(){
    const locked = $('locked');
    const unlocked = $('unlocked');
    const msgEl = $('lockMsg');

    if (!window.TKFM_REQUIRE_ANY_SUB){
      locked.classList.remove('hidden');
      unlocked.classList.add('hidden');
      msgEl.textContent = 'Subscription guard missing.';
      return false;
    }
    const ok = await window.TKFM_REQUIRE_ANY_SUB(REQUIRED, { lockedEl: locked, unlockedEl: unlocked, msgEl });
    return ok;
  }

  async function save(){
    const ok = await gate();
    if (!ok) return;

    const email = String(localStorage.getItem(LS_EMAIL) || '').trim();
    if (!email){
      msg('Missing email. Use the email you checked out with on /podcaster-live first.', false);
      return;
    }

    const payload = readForm();
    if (!payload.showName || !payload.hostName){
      msg('Show Name + Host Name are required.', false);
      return;
    }

    msg('Saving…', true);

    try{
      const res = await fetch('/.netlify/functions/podcaster-profile-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...payload })
      });
      const out = await res.json().catch(()=>({}));
      if (!res.ok || !out.ok) throw new Error(out.error || 'save failed');

      fill(out.profile || {});
      msg('✅ Saved. Your public show page is ready.', true);
    }catch(e){
      msg('❌ ' + (e && e.message ? e.message : 'Save failed.'), false);
    }
  }

  async function preview(){
    const slug = $('slug').value.trim();
    if (!slug){
      msg('Save first to generate a slug and public URL.', false);
      return;
    }
    window.open('/podcaster-show?slug=' + encodeURIComponent(slug), '_blank');
  }

  async function copyUrl(){
    const v = $('publicUrl').value || '';
    try{
      await navigator.clipboard.writeText(v);
      msg('Copied public URL to clipboard.', true);
    }catch(e){
      msg('Copy failed — select the URL and copy manually.', false);
    }
  }

  $('saveBtn').addEventListener('click', save);
  $('previewBtn').addEventListener('click', preview);
  $('copyBtn').addEventListener('click', copyUrl);

  gate();
})();
