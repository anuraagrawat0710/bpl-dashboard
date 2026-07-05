import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabase";

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        navigate("/");
        return;
      }

      setUser(data.user);

      const { data: profileData, error } = await supabase
        .from("profile")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (error || !profileData) {
        alert("Could not load your profile. Contact admin.");
        return;
      }

      if (profileData.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/staff");
      }
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome to Dashboard 🚀</h1>

      {user && (
        <div>
          <p>
            <b>Email:</b> {user.email}
          </p>
        </div>
      )}

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
