(function () {
  try {
    var isOwner = localStorage.getItem('tkfm_owner_verified') === 'true';
    if (isOwner) return;

    var pageId = (document.currentScript && document.currentScript.dataset.ownerPage) || 'owner';
    var next = encodeURIComponent(window.location.pathname + window.location.search + '#' + pageId);
    window.location.href = 'owner-login.html?next=' + next;
  } catch (e) {
    window.location.href = 'owner-login.html';
  }
})();
