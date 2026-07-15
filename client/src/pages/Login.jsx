import { useState } from "react";
import { supabase } from "../supabase/supabase";
import "../styles/Login.css";
import logo from "../assets/logo.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    console.log(data.user);

    // 👉 IMPORTANT: redirect to dashboard
    window.location.href = "/dashboard";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={logo} alt="BPL Technologies" className="login-logo" />
          <h1>BPL Technologies</h1>
          <p>Inventory &amp; Sales Management System</p>
        </div>

        <div className="login-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="email"
          />
        </div>

        <div className="login-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
          />
        </div>

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </button>
      </div>
    </div>
  );
}

export default Login;
