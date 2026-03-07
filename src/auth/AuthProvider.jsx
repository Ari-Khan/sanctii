import { Auth0Provider } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const domain = import.meta.env.VITE_AUTH0_DOMAIN || "sanctii.ca.auth0.com";
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "eOorsMDvKYVgzu4aIaESgO78FqltNT03";

export default function AuthProvider({ children }) {
  const navigate = useNavigate();

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
      onRedirectCallback={(appState) => {
        const returnTo = appState?.returnTo ?? "/";
        navigate(returnTo);
      }}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
}
