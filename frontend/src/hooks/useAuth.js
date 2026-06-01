import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAdminSessionValid } from "../utils/auth";

/**
 * Redirects to /login if admin token is not set in localStorage.
 * Use this at the top of every protected page instead of
 * duplicating the localStorage check everywhere.
 */
function useAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminSessionValid()) {
      navigate("/login");
    }
  }, [navigate]);
}

export default useAuth;
