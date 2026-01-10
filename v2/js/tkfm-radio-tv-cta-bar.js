/* TKFM Radio TV — Featured CTA Bar
   Purpose: Sell Featured placements directly on radio-tv.html.
   - Adds a "Get Featured" CTA bar (Buy & Submit flow)
   - Uses existing checkout wiring (tkfm-quick-checkout.js)
   - Relies on post-checkout deep-link to auto-open submit modal (already patched)
*/
(function(){
  function injectStyles(){
    if (document.getElementById("tkfmRadioTvCtaStyles")) return;
    const css = `
      .tkfmCtaWrap{
        max-width: 1200px;
        margin: 12px auto 10px;
        padding: 14px;
        border-radius: 22px;
        background: rgba(2,6,23,.55);
        border: 1px solid rgba(148,163,184,.18);
      }
      .tkfmCtaTop{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
      .tkfmCtaPill{font-size:.7rem;letter-spacing:.28em;text-transform:uppercase;color:rgba(34,211,238,.9)}
      .tkfmCtaTitle{font-weight:900;font-size:1.15rem;margin-top:6px;color:#e2e8f0}
      .tkfmCtaSub{color:rgba(226,232,240,.78);font-size:.92rem;margin-top:6px;max-width:860px;line-height:1.5}
      .tkfmCtaNote{color:rgba(226,232,240,.65);font-size:.82rem;margin-top:6px}
      .tkfmCtaGrid{
        display:grid;
        grid-template-columns: 1fr;
        gap: 10px;
        margin-top: 12px;
      }
      @media (min-width: 980px){
        .tkfmCtaGrid{grid-template-columns: repeat(4, 1fr)}
      }
      .tkfmCtaCard{
        border-radius: 18px;
        border: 1px solid rgba(34,211,238,.12);
        background: rgba(2,6,23,.35);
        padding: 12px;
      }
      .tkfmCtaCardHead{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .tkfmCtaBadge{
        width:44px;height:36px;border-radius:14px;
        display:flex;align-items:center;justify-content:center;
        background: linear-gradient(90deg, rgba(168,85,247,.35), rgba(236,72,153,.25));
        border: 1px solid rgba(168,85,247,.35);
        color:#e2e8f0;font-weight:900;letter-spacing:.06em;
      }
      .tkfmCtaCardTitle{font-weight:900;color:#e2e8f0;margin-top:10px}
      .tkfmCtaCardDesc{color:rgba(226,232,240,.72);font-size:.86rem;margin-top:6px;line-height:1.45}
      .tkfmCtaBtn{
        margin-top: 10px;
        width:100%;
        border-radius: 999px;
        padding: 10px 12px;
        border: 1px solid rgba(34,211,238,.35);
        background: rgba(2,6,23,.65);
        color:#e2e8f0;
        font-weight: 900;
        letter-spacing: .14em;
        text-transform: uppercase;
        font-size: .72rem;
        cursor: pointer;
        white-space: nowrap;
      }
      .tkfmCtaBtn:hover{border-color: rgba(34,211,238,.55)}
      .tkfmCtaBtnGold{
        background: linear-gradient(90deg, rgba(250,204,21,.18), rgba(249,115,22,.12));
        border-color: rgba(250,204,21,.30);
      }
      .tkfmCtaBtnPink{
        background: linear-gradient(90deg, rgba(236,72,153,.22), rgba(168,85,247,.22));
        border-color: rgba(236,72,153,.35);
      }
    `;
    const st = document.createElement("style");
    st.id = "tkfmRadioTvCtaStyles";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function boot(){
    const host = document.getElementById("tkfmRadioTvCtaHost");
    if (!host) return;

    injectStyles();

    host.innerHTML = `
      <section class="tkfmCtaWrap" aria-label="Get Featured">
        <div class="tkfmCtaTop">
          <div>
            <div class="tkfmCtaPill">GET FEATURED • PAID LANES</div>
            <div class="tkfmCtaTitle">Buy placement → submit instantly → go live.</div>
            <div class="tkfmCtaSub">
              These are the paid lanes that feed your Featured queue. After checkout, you’ll be routed to the submit flow automatically.
              Owner approves → you show up in Featured TV / Featured Podcasts.
            </div>
            <div class="tkfmCtaNote">Pro tip: use clean links (YouTube / Spotify / SoundCloud / Drive share link).</div>
          </div>
          <div class="tkfmCtaNote">
            Need options? <a href="/pricing.html" style="color:rgba(147,197,253,.95);font-weight:900;text-decoration:none;">Open Pricing</a>
          </div>
        </div>

        <div class="tkfmCtaGrid">
          <div class="tkfmCtaCard">
            <div class="tkfmCtaCardHead">
              <div class="tkfmCtaBadge">TV</div>
              <div class="tkfmCtaPill" style="color:rgba(34,211,238,.9)">MONTHLY</div>
            </div>
            <div class="tkfmCtaCardTitle">Monthly Visuals Lane</div>
            <div class="tkfmCtaCardDesc">Best for consistent motion. Your visuals stay in rotation and feed Featured.</div>
            <button class="tkfmCtaBtn tkfmCtaBtnPink" data-plan="video_monthly_visuals" type="button">Buy & Submit</button>
          </div>

          <div class="tkfmCtaCard">
            <div class="tkfmCtaCardHead">
              <div class="tkfmCtaBadge">MV</div>
              <div class="tkfmCtaPill" style="color:rgba(236,72,153,.95)">PUSH</div>
            </div>
            <div class="tkfmCtaCardTitle">Music Video Push</div>
            <div class="tkfmCtaCardDesc">Single release push. Targeted placement + attention spike.</div>
            <button class="tkfmCtaBtn tkfmCtaBtnPink" data-plan="video_music_video_push" type="button">Buy & Submit</button>
          </div>

          <div class="tkfmCtaCard">
            <div class="tkfmCtaCardHead">
              <div class="tkfmCtaBadge">RLS</div>
              <div class="tkfmCtaPill" style="color:rgba(250,204,21,.95)">PACK</div>
            </div>
            <div class="tkfmCtaCardTitle">Reels Pack</div>
            <div class="tkfmCtaCardDesc">Short-form clips that keep the algorithm moving — and feed your station brand.</div>
            <button class="tkfmCtaBtn tkfmCtaBtnGold" data-plan="video_reels_pack" type="button">Buy & Submit</button>
          </div>

          <div class="tkfmCtaCard">
            <div class="tkfmCtaCardHead">
              <div class="tkfmCtaBadge">ROT</div>
              <div class="tkfmCtaPill" style="color:rgba(59,130,246,.95)">BOOST</div>
            </div>
            <div class="tkfmCtaCardTitle">Rotation Boost</div>
            <div class="tkfmCtaCardDesc">Turn the dial up. Boost exposure across TKFM lanes (radio + TV).</div>
            <button class="tkfmCtaBtn" data-plan="rotation_boost_campaign" type="button">Buy & Submit</button>
          </div>
        </div>
      </section>
    `;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
