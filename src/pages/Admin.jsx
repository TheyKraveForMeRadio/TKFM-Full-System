import React, { useState, useEffect } from "react";
import UploadMixtape from "../admin/UploadMixtape";

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("adminToken"));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // -------------------------------
  // Verify Token on Page Load
  // -------------------------------
  useEffect(() => {
    async function verify() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/.netlify/functions/admin-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (data.valid) {
          setLoading(false);
        } else {
          localStorage.removeItem("adminToken");
          setToken(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Verification error:", err);
        localStorage.removeItem("adminToken");
        setToken(null);
        setLoading(false);
      }
    }

    verify();
  }, [token]);

  // -------------------------------
  // Login Handler
  // -------------------------------
  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");

    try {
      const res = await fetch("/.netlify/functions/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("adminToken", data.token);
        setToken(data.token);
      } else {
        setAuthError(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Server error");
    }
  }

  // -------------------------------
  // Logout
  // -------------------------------
  function handleLogout() {
    localStorage.removeItem("adminToken");
    setToken(null);
  }

  // -------------------------------
  // Loading State
  // -------------------------------
  if (loading) {
    return (
      <div className="card">
        <h3>Checking admin authentication…</h3>
      </div>
    );
  }

  // -------------------------------
  // Login Form
  // -------------------------------
  if (!token) {
    return (
      <div className="card" style={{ maxWidth: "400px", margin: "50px auto" }}>
        <h2>Admin Login</h2>

        {authError && <p style={{ color: "red" }}>{authError}</p>}

        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  // -------------------------------
  // Admin Dashboard
  // -------------------------------
  return (
    <div className="card" style={{ marginBottom: "200px" }}>
      <h1>Admin Panel</h1>
      <p>Welcome, admin! Manage your site below.</p>

      <button onClick={handleLogout} style={{ marginBottom: "20px" }}>
        Logout
      </button>

      <hr />
      <h2>Upload Mixtape</h2>

      <UploadMixtape />
    </div>
  );
}
