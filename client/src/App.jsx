import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase/supabase";
import Login from "./pages/Login";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        navigate("/dashboard");
      }
    };

    checkUser();
  }, []);

  return <Login />;
}

export default App;
