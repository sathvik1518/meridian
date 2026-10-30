import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Forbidden from "../../pages/Forbidden";
import Spinner from "../ui/Spinner";

// Wraps pages that need a signed-in user. If nobody is signed in we send them to
// /login and remember where they were going, so login can bring them back.
export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center" role="status" aria-label="Checking your session">
        <Spinner className="size-6 text-accent" />
      </div>
    );
  }
  if (status === "anonymous") return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

// Wraps pages that need a specific role. Signed in but not allowed = 403 page.
export function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Forbidden requiredRole={roles[0]} />;
  return children;
}
