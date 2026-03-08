import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { T, Icons } from "../theme";
import { ROLE } from "../auth/roles";
import { BgOrbs, EcgStrip } from "../components/SharedUI";


export default function LoginPage() {
  const { loginWithRedirect, isLoading, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const [cardMode, setCardMode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [role, setRole] = useState(ROLE.PATIENT);
  const fileRef = useRef();

  // If already logged in, bounce straight to maze
  useEffect(() => {
    // if (isAuthenticated) navigate("/app", { replace: true });
  }, [isAuthenticated, navigate]);

  const doScan = () => {
    setScanning(true); setScanned(false);
    setTimeout(() => {
      setScanning(false); setScanned(true);
      setScanData({ name:"Jordan A. Mitchell", dob:"1989-03-14", cardNo:"HC-4821-0039-JM", province:"Ontario", expiry:"2027-01-01" });
    }, 2600);
  };

  const signIn = (connection) => {
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin,
        ...(connection && { connection }),
        sanctii_role: role,
      },
      appState: { returnTo: "/app" },
    });
  };

  return (
    <div style={{ position:"fixed", inset:0, display:"flex" }}>
      <BgOrbs/>

      {/* ── LEFT BRAND PANEL ── */}
      <div style={{ width:"44%", position:"relative", overflow:"visible", background:`linear-gradient(160deg,${T.roseDeep} 0%,#7A2525 100%)`, display:"flex", flexDirection:"column", justifyContent:"center", padding:"56px 48px" }}>
        <div style={{ position:"absolute", right:-80, top:"50%", transform:"translateY(-50%)", opacity:.05, color:T.white, fontSize:440, lineHeight:1, fontWeight:800, userSelect:"none" }}>+</div>
        <EcgStrip bottom="8%" opacity={.18} color={T.white}/>

        <div style={{ animation:"slideR .6s ease", zIndex:1 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", color:T.white, marginBottom:18, backdropFilter:"blur(8px)" }}>
            <Icons.cross/>
          </div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:44, color:T.white, letterSpacing:"-0.04em", lineHeight:1.05, marginBottom:10 }}>
            Welcome<br/>to Sanctii
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:16, color:"rgba(255,255,255,.65)", lineHeight:1.65, marginBottom:44 }}>
            Intelligent healthcare begins<br/>before you walk through the door.
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:13, zIndex:1 }}>
          {[
            [<Icons.shield/>, "Auth0 enterprise authentication"],
            [<Icons.card/>,   "Instant health card scanning"],
            [<Icons.heartbeat/>, "AI-powered triage with Presage"],
            [<Icons.mapPin/>, "Real-time hospital routing"],
          ].map(([ic, text], i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, animation:`slideR .6s ease ${.1+i*.1}s both`, opacity:0 }}>
              <div style={{ color:"rgba(255,255,255,.55)", flexShrink:0 }}>{ic}</div>
              <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:"rgba(255,255,255,.75)", fontWeight:400 }}>{text}</span>
            </div>
          ))}
        </div>

      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"44px 52px", background:T.bg, overflowY:"auto" }}>
        <div style={{ width:"100%", maxWidth:400, animation:"fadeUp .5s ease" }}>

          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:28, color:T.ink, letterSpacing:"-0.03em", marginBottom:4 }}>Sign in</div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:14, color:T.inkFaint, marginBottom:28 }}>Access your Sanctii health dashboard</div>

          <div style={{ display:"flex", flexDirection:"column", gap:11, animation:"fadeUp .3s ease" }}>
            <button className="btn-primary"
              onClick={() => signIn(null)}
              disabled={isLoading}
              style={{ width:"100%", padding:"15px 0", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", gap:12, borderRadius:16 }}
            >
              <Icons.shield/>
              {isLoading ? "Connecting…" : "Continue with Auth0 →"}
            </button>

            <button
              onClick={() => signIn("google-oauth2")}
              disabled={isLoading}
              style={{ width:"100%", padding:"14px 0", borderRadius:16, border:`1.5px solid ${T.border}`, background:T.surfaceHard, cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:14, color:T.ink, display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all .2s" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.rose; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; }}
            >
              <Icons.google/> Continue with Google
            </button>
          </div>

          <div style={{ marginTop:22, fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.1em", textTransform:"uppercase", textAlign:"center", lineHeight:1.8 }}>
            Secured by Auth0 · HIPAA-aligned · SOC 2 Type II<br/>
            By signing in you agree to Sanctii's Terms &amp; Privacy Policy
          </div>
        </div>
      </div>

    </div>
  );
}

