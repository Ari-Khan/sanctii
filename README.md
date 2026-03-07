# Sanctii

> ⚠️ **Environment variables required**:
> 
> * `GEMINI_API_KEY` – Google Gemini/GenAI key used by backend routes.
> * `VITE_API_BASE` (optional) – URL of backend when running the frontend (`http://localhost:3001` by default). If you use a proxy or different host, set this in `.env` at the project root.
>
> ## Running both servers together
> Install the new dependency by running `npm install` in the project root (it adds `concurrently`).
> After that you can launch both backend and frontend with a single command:
> ```sh
> npm run start:all
> ```
> This spins up `node backend/index.js` and `npm run dev` side‑by‑side. Before starting it will also try to kill any processes listening on ports `3001`, `5173`, or `5176` so stale servers don’t conflict.


React + Vite app with Auth0 (doctor/patient sign-in).

## Auth0 – production vs development

The app uses Auth0 credentials from environment variables when set. **Do not use Auth0 “Development” keys in production.**

- **Development:** If you don’t set env vars, the app falls back to built-in dev values (for local use only).
- **Production:** Create a separate **Production** Application in the [Auth0 Dashboard](https://manage.auth0.com/), then set:
  - `VITE_AUTH0_DOMAIN` – your tenant domain (e.g. `your-tenant.auth0.com`)
  - `VITE_AUTH0_CLIENT_ID` – the production application’s Client ID  

  Copy `.env.example` to `.env` and fill in these values. Never commit `.env`.

In Auth0 Dashboard → Branding → Universal Login you can theme the login screen (e.g. red `#B91C1C` and cream `#FAF7F2`) so it matches the app.

### Fix: “Connections using Auth0 development keys”

That message means a **Social connection** (Google, Facebook, Apple, etc.) is using Auth0’s test keys instead of your own. Fix it in the Auth0 Dashboard:

1. Open [Auth0 Dashboard](https://manage.auth0.com/) → **Authentication** → **Social** (or **Connections** → **Social**).
2. For each connection that shows the warning you have two options:
   - **Use your own keys (for production):** Click the connection → get a **Client ID** and **Client Secret** from that provider (e.g. [Google Cloud Console](https://console.cloud.google.com/) for Google) → paste them into the connection and save. Then the warning goes away.
   - **Only need email/password:** If you don’t need that social login, turn **off** that connection for your Application: **Applications** → your app → **Connections** tab → disable the social connection that uses dev keys.

After every connection either has your own keys or is disabled for your app, the warning will stop.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
