// v2/auth-gateway.js
// Thin forwarder so imports using "./auth-gateway.js"
// still work alongside "./js/auth-gateway.js"

export {
  protectPage,
  routeAfterLogin,
  setFakeUser,
  logout
} from "./js/auth-gateway.js";
