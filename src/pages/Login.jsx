import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const PERSISTED_ROLE_KEY = "sanctii_role";

export function getPersistedRole() {
  return localStorage.getItem(PERSISTED_ROLE_KEY);
}

export function setPersistedRole(role) {
  if (role) localStorage.setItem(PERSISTED_ROLE_KEY, role);
  else localStorage.removeItem(PERSISTED_ROLE_KEY);
}

export default function Login() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  const role = getPersistedRole();

  // Signed in and already have a role → go to that page
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && role) {
      navigate(role === "doctor" ? "/doctor" : "/patient", { replace: true });
    }
  }, [isAuthenticated, isLoading, role, navigate]);

  const handleSignIn = () => {
    loginWithRedirect({ appState: { returnTo: "/" } });
  };

  const handleChooseRole = (chosenRole) => {
    setPersistedRole(chosenRole);
    navigate(chosenRole === "doctor" ? "/doctor" : "/patient", { replace: true });
  };

  if (isLoading) return <div className="page-loading">Loading...</div>;

  // Signed in and have a role → redirecting (don’t show Sign in form)
  if (isAuthenticated && role) {
    return <div className="page-loading">Redirecting...</div>;
  }

  // Signed in but no role yet → one-time role selection (e.g. right after signup)
  if (isAuthenticated && !role) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Sanctii</h1>
          <p className="login-subtitle">Choose your role</p>
          <p className="login-role-prompt">Are you a doctor or a patient? This will be saved for future sign-ins.</p>
          <div className="login-buttons">
            <button
              type="button"
              className="login-btn doctor"
              onClick={() => handleChooseRole("doctor")}
            >
              Doctor
            </button>
            <button
              type="button"
              className="login-btn patient"
              onClick={() => handleChooseRole("patient")}
            >
              Patient
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not signed in → single Sign in button
  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Sanctii</h1>
        <p className="login-subtitle">Sign in to continue</p>
        <button type="button" className="login-btn sign-in" onClick={handleSignIn}>
          Sign in
        </button>
      </div>
    </div>
  );
}
