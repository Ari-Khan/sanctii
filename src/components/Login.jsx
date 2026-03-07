import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
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
  const { loginWithRedirect, user, isAuthenticated, isLoading } = useAuth0();
  const [role, setRole] = useState(getPersistedRole());
  const [fetching, setFetching] = useState(false);
  const navigate = useNavigate();

  // when the user signs in fetch their persisted role from the server
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setFetching(true);
      fetch(`/api/users?email=${encodeURIComponent(user.email)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => {
          if (u?.role) {
            setRole(u.role);
            setPersistedRole(u.role);
          }
        })
        .catch(console.error)
        .finally(() => setFetching(false));
    }
  }, [isAuthenticated, user]);

  // redirect as soon as we know which role to use
  useEffect(() => {
    if (!isLoading && !fetching && role) {
      if (role === "doctor") {
        navigate("/doctor", { replace: true });
      } else if (role === "patient") {
        navigate("/patient", { replace: true });
      } else if (role === "hacker") {
        navigate("/hacker", { replace: true });
      }
    }
  }, [role, isLoading, fetching, navigate]);

  const handleSignIn = () => {
    loginWithRedirect({ appState: { returnTo: "/" } });
  };

  const handleChooseRole = (chosenRole) => {
    setPersistedRole(chosenRole);
    // send the choice to the backend (upsert)
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user?.email, role: chosenRole }),
    })
      .catch(console.error)
      .finally(() => {
        setRole(chosenRole);
        if (chosenRole === "doctor") {
          navigate("/doctor", { replace: true });
        } else if (chosenRole === "patient") {
          navigate("/patient", { replace: true });
        } else if (chosenRole === "hacker") {
          navigate("/hacker", { replace: true });
        }
      });
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
          <p className="login-role-prompt">
            Are you a doctor, a patient, or a hacker? This will be saved for future
            sign-ins.
          </p>
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
            <button
              type="button"
              className="login-btn hacker"
              onClick={() => handleChooseRole("hacker")}
            >
              Hacker
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
        <button
          type="button"
          className="login-btn sign-in"
          onClick={handleSignIn}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
