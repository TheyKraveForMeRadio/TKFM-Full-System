const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

function setYear(){
  const y = new Date().getFullYear();
  $$(".js-year").forEach(n => n.textContent = String(y));
}

function mobileNav(){
  const btn = $(".js-nav-btn");
  const panel = $(".js-nav-panel");
  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    const open = panel.getAttribute("data-open") === "true";
    panel.setAttribute("data-open", open ? "false" : "true");
    btn.setAttribute("aria-expanded", open ? "false" : "true");
  });

  // close on link click
  $$(".js-nav-panel a").forEach(a => a.addEventListener("click", () => {
    panel.setAttribute("data-open", "false");
    btn.setAttribute("aria-expanded", "false");
  }));
}

function glowCursor(){
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  document.body.appendChild(glow);

  let raf = null;
  window.addEventListener("mousemove", (e) => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });
  });
}

function copyLinkButtons(){
  $$(".js-copy-link").forEach(btn => {
    btn.addEventListener("click", async () => {
      const url = btn.getAttribute("data-url") || window.location.href;
      try {
        await navigator.clipboard.writeText(url);
        btn.textContent = "Copied ✓";
        setTimeout(() => btn.textContent = "Copy Link", 1200);
      } catch {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        btn.textContent = "Copied ✓";
        setTimeout(() => btn.textContent = "Copy Link", 1200);
      }
    });
  });
}

function fakeWaitlist(){
  const form = $(".js-waitlist");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $(".js-waitlist-email")?.value?.trim();
    if (!email) return;
    $(".js-waitlist-email").value = "";
    $(".js-waitlist-msg").textContent = "You’re in. Founder updates coming soon.";
  });
}

setYear();
mobileNav();
glowCursor();
copyLinkButtons();
fakeWaitlist();
