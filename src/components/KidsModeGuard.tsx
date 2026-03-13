import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useKidsMode } from "@/contexts/KidsModeContext";

/**
 * Redirects users to home when they try to access non-kid-friendly routes in Kids Mode.
 * Place inside BrowserRouter.
 */
const KidsModeGuard = () => {
  const { isKidsMode, isKidsFriendlyRoute } = useKidsMode();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isKidsMode && !isKidsFriendlyRoute(location.pathname) && !location.pathname.startsWith("/admin")) {
      navigate("/", { replace: true });
    }
  }, [isKidsMode, location.pathname, navigate, isKidsFriendlyRoute]);

  return null;
};

export default KidsModeGuard;
