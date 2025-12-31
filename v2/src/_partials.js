export function header(active="") {
  const link = (href, label, key) =>
    `<a href="${href}" class="${active===key ? "is-active" : ""}">${label}</a>`;

  return `
  <header class="header">
    <div class="container">
      <div class="header-inner">
        <a class="brand" href="/index.html">
          <img src="/tkfm-logo.jpg" alt="TKFM Radio logo" />
          <div class="title">
            <strong>TKFM RADIO</strong>
            <span>The Independent Artist Power Station</span>
          </div>
        </a>

        <nav class="nav">
          ${link("/artists.html","Artists","artists")}
          ${link("/djs.html","DJs","djs")}
          ${link("/sponsors.html","Sponsors","sponsors")}
          ${link("/label.html","Label","label")}
          ${link("/news.html","News","news")}
          ${link("/contact.html","Contact","contact")}
        </nav>

        <div class="cta-row">
          <span class="badge"><span class="dot"></span> Launching 2026</span>
          <a class="btn btn-primary" href="/submit.html">Submit Music</a>
          <button class="btn mobile-btn js-nav-btn" aria-expanded="false" aria-label="Open menu">Menu</button>
        </div>
      </div>

      <div class="mobile-panel js-nav-panel" data-open="false">
        <a href="/artists.html">Artists</a>
        <a href="/djs.html">DJs</a>
        <a href="/sponsors.html">Sponsors</a>
        <a href="/label.html">Label</a>
        <a href="/news.html">News</a>
        <a href="/contact.html">Contact</a>
      </div>
    </div>
  </header>
  `;
}

export function footer() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="badge" style="margin-bottom:10px;">
            <span class="dot" style="background: var(--blue); box-shadow:0 0 0 6px rgba(42,167,255,.12)"></span>
            Premium independent radio + label platform
          </div>
          <div style="max-width:62ch; color: rgba(255,255,255,.68); line-height:1.7;">
            TKFM is built to break independent artists first — clean brand, real placement, and growth-focused services.
            <span class="js-year"></span> © TKFM Radio.
          </div>
          <div class="small-links" style="margin-top:12px;">
            <a href="/media-kit.html">Media Kit</a>
            <a href="/submit.html">Submit</a>
            <a href="/contact.html">Business Contact</a>
          </div>
        </div>

        <div class="card">
          <div class="inner">
            <h3 style="margin:0 0 6px;">Founder Updates</h3>
            <p style="margin:0 0 12px;">Get first access to 2026 launch perks, drops, and opportunities.</p>
            <form class="form js-waitlist">
              <input class="input js-waitlist-email" type="email" placeholder="your@email.com" required />
              <button class="btn btn-primary" type="submit">Join</button>
            </form>
            <div class="hr"></div>
            <div class="small-links">
              <a href="https://tkfmradio.com" target="_blank" rel="noreferrer">tkfmradio.com</a>
              <button class="btn js-copy-link" type="button" data-url="https://tkfmradio.com">Copy Link</button>
            </div>
            <div style="margin-top:10px; color: rgba(255,255,255,.72)" class="js-waitlist-msg"></div>
          </div>
        </div>

      </div>
    </div>
  </footer>
  `;
}
