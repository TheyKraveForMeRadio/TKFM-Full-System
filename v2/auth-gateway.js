/**
 * TKFM v2 ACCESS GATEWAY
 * Owner / Label / DJ / Radio Routing
 */

export function protectPage() {
  const user = JSON.parse(localStorage.getItem("tkfm_user") || "null");
  if (!user) {
    window.location.href = "login.html";
    return false;
  }
  return user;
}

export function logoutAndReturnToLogin() {
  localStorage.removeItem("tkfm_user");
  window.location.href = "login.html";
}

/**
 * Some old pages imported TKFM_Gateway.check()
 */
export const TKFM_Gateway = {
  check: protectPage,
  logout: logoutAndReturnToLogin,
};

/**
 * Some login pages imported routeAfterLogin()
 * We define it so Vite doesn't break.
 */
export function routeAfterLogin(user) {
  // Default: send user to GOD VIEW
  window.location.href = "god-view.html";
  return user;
}
