// v2/js/auth-gateway.js
// ==================================================
// TKFM v2 Auth Gateway (local mode)
// - Page protection by role
// - Post-login routing
// - Fake user helper for testing
// ==================================================

/**
 * Protect a page by allowed roles.
 * Usage: protectPage(["owner","label"])
 */
export function protectPage(allowedRoles = []) {
  try {
    const raw = localStorage.getItem("tkfm_user");
    if (!raw) {
      return redirectToLogin();
    }

    const user = JSON.parse(raw);
    const role = user.tkfm_role;

    if (!allowedRoles.includes(role)) {
      alert(
        `Access denied.\nRequired roles: ${allowedRoles.join(
          ", "
        )}\nYour role: ${role || "none"}`
      );
      return redirectToDashboard();
    }

    console.log("🔐 Access granted:", role);
  } catch (err) {
    console.warn("protectPage() error:", err);
    redirectToLogin();
  }
}

/**
 * Route after Supabase login.
 * You can call this from v2/login.html:
 *   routeAfterLogin(user);
 */
export function routeAfterLogin(user) {
  try {
    // Supabase user shape: { user_metadata: { tkfm_role: "artist" | "dj" | ... } }
    const role =
      user?.user_metadata?.tkfm_role ||
      user?.tkfm_role || // fallback if we pass a simplified object
      "artist";

    // Store in localStorage so protectPage() can read it
    localStorage.setItem("tkfm_user", JSON.stringify({ tkfm_role: role }));
    console.log("✅ routeAfterLogin: role =", role);

    // Routing logic for TKFM v2
    if (role === "owner" || role === "label") {
      // Label / owner side: black & gold hub
      window.location.href = "/v2/label-hub.html";
    } else if (role === "dj") {
      // DJ → radio-side dashboard (neon)
      window.location.href = "/v2/dashboard.html";
    } else if (role === "sponsor") {
      // Sponsor → label sponsor engine
      window.location.href = "/v2/label-sponsor-engine.html";
    } else {
      // Default: artist dashboard
      window.location.href = "/v2/dashboard.html";
    }
  } catch (err) {
    console.error("routeAfterLogin() error:", err);
    redirectToDashboard();
  }
}

/**
 * Simulate login for testing without backend
 * Example in DevTools console:
 *   setFakeUser("owner")
 */
export function setFakeUser(role = "artist") {
  localStorage.setItem("tkfm_user", JSON.stringify({ tkfm_role: role }));
  console.log("🧪 Fake user set:", role);
}

/**
 * Remove user / simulate logout
 */
export function logout() {
  localStorage.removeItem("tkfm_user");
  window.location.href = "/v2/login.html";
}

/**
 * Redirect helpers
 */
function redirectToLogin() {
  console.log("➡️ redirect to login (local mode)");
  window.location.href = "/v2/login.html";
}
function redirectToDashboard() {
  console.log("➡️ redirect to dashboard (local mode)");
  window.location.href = "/v2/dashboard.html";
}
