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
    if (isAuthenticated) navigate("/app", { replace: true });
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
    <div style={{ position:"fixed", inset:0, display:"flex", overflow:"hidden" }}>
      <BgOrbs/>

      {/* ── LEFT BRAND PANEL ── */}
      <div style={{ width:"44%", position:"relative", overflow:"hidden", background:`linear-gradient(160deg,${T.roseDeep} 0%,#7A2525 100%)`, display:"flex", flexDirection:"column", justifyContent:"center", padding:"56px 48px" }}>
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

        <div style={{ marginTop:44, display:"flex", gap:14, flexWrap:"wrap", zIndex:1 }}>
          {[["♥","72 bpm"],["⚡","98% SpO₂"],["🌡","36.6°C"]].map(([ic,v])=>(
            <div key={v} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:100, background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)" }}>
              <span style={{ fontSize:10 }}>{ic}</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,.7)", letterSpacing:"0.04em" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"44px 52px", background:T.bg, overflowY:"auto" }}>
        <div style={{ width:"100%", maxWidth:400, animation:"fadeUp .5s ease" }}>

          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:28, color:T.ink, letterSpacing:"-0.03em", marginBottom:4 }}>Sign in</div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:14, color:T.inkFaint, marginBottom:28 }}>Access your Sanctii health dashboard</div>

          <div style={{ marginBottom:22 }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:"0.14em", textTransform:"uppercase", color:T.inkFaint, marginBottom:8 }}>I am a</div>
            <div style={{ display:"flex", gap:5, padding:4, background:T.bgDeep, borderRadius:12 }}>
              {[ROLE.PATIENT, ROLE.DOCTOR, ROLE.ADMIN].map(r=>(
                <button key={r} onClick={()=>setRole(r)} style={{ flex:1, padding:"9px 0", border:"none", cursor:"pointer", borderRadius:8, fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:12, background:role===r?T.white:"transparent", color:role===r?T.rose:T.inkFaint, boxShadow:role===r?"0 2px 8px rgba(160,80,80,.12)":"none", transition:"all .2s", textTransform:"capitalize" }}>{r}</button>
              ))}
            </div>
          </div>

          {!cardMode && (
            <div style={{ display:"flex", flexDirection:"column", gap:11, animation:"fadeUp .3s ease" }}>
              <button className="btn-primary"
                onClick={() => signIn(null)}
                disabled={isLoading}
                style={{ width:"100%", padding:"14px 0", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}
              >
                <Icons.shield/>
                {isLoading ? "Connecting…" : "Continue with Auth0 →"}
              </button>

              <button
                onClick={() => signIn("google-oauth2")}
                disabled={isLoading}
                style={{ width:"100%", padding:"13px 0", borderRadius:100, border:`1.5px solid ${T.border}`, background:T.surfaceHard, cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:13, color:T.ink, display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all .2s" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.rose; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; }}
              >
                <Icons.google/> Continue with Google
              </button>

              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ flex:1, height:1, background:T.border }}/>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.inkFaint, letterSpacing:"0.12em", textTransform:"uppercase" }}>or</span>
                <div style={{ flex:1, height:1, background:T.border }}/>
              </div>

              <button onClick={()=>setCardMode(true)}
                style={{ width:"100%", padding:"13px 0", borderRadius:100, border:`1.5px solid ${T.borderStrong}`, background:"transparent", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:13, color:T.inkMid, display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all .2s" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.rose; e.currentTarget.style.color=T.rose; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.borderStrong; e.currentTarget.style.color=T.inkMid; }}
              >
                <Icons.card/> Sign in with Health Card
              </button>
            </div>
          )}

          {cardMode && (
            <div style={{ animation:"fadeUp .3s ease" }}>
              <button onClick={()=>{ setCardMode(false); setScanned(false); setScanning(false); }}
                style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkFaint, marginBottom:14, display:"flex", alignItems:"center", gap:6, padding:0 }}>
                ← Back to sign-in options
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={doScan}/>
              <div onClick={()=>!scanning&&fileRef.current.click()}
                style={{ borderRadius:16, overflow:"hidden", cursor:"pointer", border:`2px dashed ${scanned?T.vital:scanning?T.rose:T.borderStrong}`, background:scanned?"rgba(91,170,138,.08)":scanning?T.roseTint:T.bgDeep, minHeight:200, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", transition:"all .3s ease", padding:24 }}>
                {scanning && <div style={{ position:"absolute", left:"5%", right:"5%", height:2, background:`linear-gradient(90deg,transparent,${T.rose} 30%,${T.rose} 70%,transparent)`, boxShadow:`0 0 12px ${T.roseGlow}`, animation:"scanLine 1.4s ease-in-out infinite" }}/>}

                {!scanning && !scanned && <>
                   <div style={{ marginBottom:14 }}>
                    <svg width="70" height="46" viewBox="0 0 70 46" fill="none">
                      <rect x="1" y="1" width="68" height="44" rx="6" fill={T.bgDeep} stroke={T.borderStrong} strokeWidth="1.5"/>
                      <rect x="7" y="7" width="19" height="13" rx="3" fill={T.rosePale} opacity=".7"/>
                      <line x1="33" y1="9" x2="61" y2="9" stroke={T.border} strokeWidth="2" strokeLinecap="round"/>
                      <line x1="33" y1="15" x2="54" y2="15" stroke={T.border} strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="7" y1="28" x2="63" y2="28" stroke={T.border} strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="7" y1="36" x2="38" y2="36" stroke={T.border} strokeWidth="1.5" strokeLinecap="round"/>
                      <rect x="46" y="30" width="16" height="9" rx="2" fill={T.rosePale} opacity=".5"/>
                    </svg>
                  </div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:15, color:T.ink, marginBottom:5 }}>Scan your Health Card</div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkFaint, textAlign:"center", lineHeight:1.55, marginBottom:14 }}>Upload your provincial health card<br/>for instant OCR verification</div>
                  <button className="btn-ghost" onClick={e=>{e.stopPropagation(); doScan();}} style={{ fontSize:11, padding:"7px 18px" }}>Demo Scan</button>
                </>}

                {scanning && <div style={{ textAlign:"center", padding:"16px 0" }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", border:`2px solid ${T.rosePale}`, borderTopColor:T.rose, animation:"spin .8s linear infinite", margin:"0 auto 14px" }}/>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:14, color:T.ink }}>Scanning card…</div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkFaint, marginTop:3 }}>Reading health card data via OCR</div>
                </div>}

                {scanned && scanData && <div style={{ width:"100%", animation:"fadeUp .4s ease" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                    <div style={{ width:22, height:22, borderRadius:"50%", background:T.vital, display:"flex", alignItems:"center", justifyContent:"center" }}><Icons.check/></div>
                    <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:13, color:T.vital }}>Card Verified Successfully</span>
                  </div>
                  <div style={{ background:T.white, borderRadius:10, padding:"12px 16px", display:"flex", flexDirection:"column", gap:7 }}>
                    {[["Name",scanData.name],["Date of Birth",scanData.dob],["Card No.",scanData.cardNo],["Province",scanData.province],["Expiry",scanData.expiry]].map(([k,v])=>(
                      <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.inkFaint, letterSpacing:"0.1em", textTransform:"uppercase" }}>{k}</span>
                        <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, color:T.ink }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>}
              </div>

              {scanned && (
                <button className="btn-primary" onClick={()=>signIn(null)}
                  style={{ width:"100%", marginTop:14, padding:"13px 0", fontSize:14 }}>
                  Continue to Sign In →
                </button>
              )}
            </div>
          )}

          <div style={{ marginTop:22, fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.1em", textTransform:"uppercase", textAlign:"center", lineHeight:1.8 }}>
            Secured by Auth0 · HIPAA-aligned · SOC 2 Type II<br/>
            By signing in you agree to Sanctii's Terms &amp; Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
}
