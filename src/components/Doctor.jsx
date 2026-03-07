import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setPersistedRole } from "./Login";

export default function Doctor() {
  const { isAuthenticated, isLoading, user, logout } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    setPersistedRole("doctor");
  }, []);

  if (isLoading) return <div className="page-loading">Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className="doctor-page">
      <header className="page-header">
        <h1>Doctor page</h1>
        <div className="user-info">
          <span>{user?.name ?? user?.email}</span>
          <button
            type="button"
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          >
            Log out
          </button>
        </div>
      </header>
      <main>
        <p>Doctor page</p>
        <p className="switch-role">
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setPersistedRole("");
              navigate("/", { replace: true });
            }}
          >
            Not a doctor? Choose role again
          </button>
        </p>
      </main>
    </div>
  );
}
