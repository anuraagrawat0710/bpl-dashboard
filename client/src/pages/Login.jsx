import { useState } from "react";
import { supabase } from "../supabase/supabase";
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Login Successful!");

    console.log(data.user);

    // 👉 IMPORTANT: redirect to dashboard
    window.location.href = "/dashboard";
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>BPL Technologies</h1>

        <p>Inventory & Sales Management System</p>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
}

export default Login;
