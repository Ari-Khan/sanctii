import { useState, useRef } from "react";
import Landing from "./Landing.jsx";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:          "#F8F0E8",
  bgDeep:      "#F0E4D4",
  surface:     "rgba(255,248,240,0.85)",
  surfaceHard: "#FFFAF4",
  border:      "rgba(200,160,140,0.3)",
  borderStrong:"rgba(180,100,100,0.45)",
  rose:        "#D4706A",
  roseMid:     "#C05858",
  roseDeep:    "#A84040",
  rosePale:    "#EEBABA",
  roseGlow:    "rgba(212,112,106,0.35)",
  roseTint:    "rgba(212,112,106,0.08)",
  vital:       "#5BAA8A",
  vitalPale:   "rgba(91,170,138,0.15)",
  amber:       "#D4974A",
  amberPale:   "rgba(212,151,74,0.15)",
  ink:         "#2A1818",
  inkMid:      "#6B4040",
  inkFaint:    "#A08070",
  white:       "#FFFCF8",
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { width:100%; height:100%; min-height:100vh; min-width:100vw; overflow:hidden; }
    body { font-family:'Outfit',sans-serif; background:${T.bg}; color:${T.ink}; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:${T.rosePale}; border-radius:4px; }

    @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes slideR   { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
    @keyframes ecgLoop  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes pulse    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:.8} }
    @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes breathe  { 0%,100%{box-shadow:0 0 0 0 ${T.roseGlow}} 50%{box-shadow:0 0 0 14px transparent} }
    @keyframes scanLine { 0%{top:8%;opacity:.9} 50%{top:88%;opacity:.4} 100%{top:8%;opacity:.9} }

    .btn-primary {
      font-family:'Outfit',sans-serif; font-weight:600; font-size:13px;
      letter-spacing:.03em; padding:11px 28px; border-radius:100px; border:none;
      background:linear-gradient(135deg,${T.rose} 0%,${T.roseDeep} 100%);
      color:${T.white}; cursor:pointer; transition:all .25s ease; position:relative; overflow:hidden;
    }
    .btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px ${T.roseGlow}; }
    .btn-ghost {
      font-family:'Outfit',sans-serif; font-weight:500; font-size:13px;
      padding:10px 24px; border-radius:100px; border:1.5px solid ${T.borderStrong};
      background:transparent; color:${T.inkMid}; cursor:pointer; transition:all .2s ease;
    }
    .btn-ghost:hover { border-color:${T.rose}; color:${T.rose}; background:${T.roseTint}; }
    .glass-hard {
      background:${T.surfaceHard}; border:1px solid ${T.border};
      border-radius:16px; box-shadow:0 2px 20px rgba(160,80,80,.06);
    }
  `}</style>
);

// ─── SHARED VISUAL COMPONENTS ─────────────────────────────────────────────────
const Icons = {
  cross:       () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8z"/></svg>,
  heartbeat:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  heart:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  stethoscope: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>,
  user:        () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  shield:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  card:        () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  brain:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.04-4.79 3 3 0 0 1-.91-4.43 3 3 0 0 1 .5-5.32A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.04-4.79 3 3 0 0 0 .91-4.43 3 3 0 0 0-.5-5.32A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
  mapPin:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  check:       () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

function EcgStrip({ opacity=0.1, color=T.rose, top="auto", bottom="auto" }) {
  return (
    <div style={{ position:"absolute", left:0, right:0, top, bottom, height:56, overflow:"hidden", pointerEvents:"none" }}>
      <div style={{ display:"flex", animation:"ecgLoop 8s linear infinite", width:"200%" }}>
        {[0,1].map(k=>(
          <svg key={k} viewBox="0 0 400 56" style={{ width:"50%", flexShrink:0 }} preserveAspectRatio="none">
            <polyline points="0,28 30,28 36,28 40,8 44,48 48,28 80,28 86,28 90,20 94,36 98,28 130,28 136,28 140,6 144,50 148,28 190,28 196,28 200,16 204,40 208,28 240,28 246,28 250,10 254,46 258,28 300,28 306,28 310,18 314,38 318,28 360,28 366,28 370,8 374,48 378,28 400,28"
              fill="none" stroke={color} strokeWidth="1.5" opacity={opacity}/>
          </svg>
        ))}
      </div>
    </div>
  );
}

function BgOrbs() {
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      <div style={{ position:"absolute", top:"-15%", right:"-10%", width:520, height:520, borderRadius:"50%", background:`radial-gradient(circle,${T.rosePale}35 0%,transparent 70%)` }}/>
      <div style={{ position:"absolute", bottom:"-20%", left:"-8%", width:620, height:620, borderRadius:"50%", background:`radial-gradient(circle,rgba(91,170,138,.1) 0%,transparent 65%)` }}/>
      <div style={{ position:"absolute", top:"35%", left:"20%", width:320, height:320, borderRadius:"50%", background:`radial-gradient(circle,rgba(212,151,74,.06) 0%,transparent 70%)` }}/>
    </div>
  );
}

// ─── HERO PAGE ────────────────────────────────────────────────────────────────
function HeroPage({ onSelectRole, onSignIn }) {
  const [hovRole, setHovRole] = useState(null);

  const features = [
    { icon: <Icons.brain/>, title: "Presage AI Triage", desc: "Instant symptom analysis powered by advanced AI", color: "#8B6FBF" },
    { icon: <Icons.heartbeat/>, title: "Live Vitals", desc: "Real-time heart rate, SpO₂ & blood pressure monitoring", color: T.rose },
    { icon: <Icons.mapPin/>, title: "Hospital Finder", desc: "Nearest facilities with live wait times & bed availability", color: T.vital },
    { icon: <Icons.shield/>, title: "Secure Records", desc: "Auth0 secured health cards & encrypted patient data", color: T.amber },
  ];

  return (
    <div style={{ position:"fixed", inset:0, display:"flex", flexDirection:"column", overflow:"auto" }}>
      <BgOrbs/>
      <EcgStrip bottom={0} opacity={0.07}/>
      <EcgStrip top="12%" opacity={0.04} color={T.vital}/>

      {/* Nav */}
      <div style={{ position:"sticky", top:0, left:0, right:0, height:66, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 40px", borderBottom:`1px solid ${T.border}`, background:"rgba(248,240,232,0.88)", backdropFilter:"blur(20px)", zIndex:50, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, animation:"breathe 3s ease-in-out infinite", flexShrink:0 }}>
            <Icons.cross/>
          </div>
          <div>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:20, color:T.ink, letterSpacing:"-0.03em" }}>Sanctii</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.14em", textTransform:"uppercase", marginTop:-2 }}>Medical Intelligence Platform</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-ghost" onClick={onSignIn} style={{ fontSize:12, padding:"8px 20px" }}>Sign In</button>
        </div>
      </div>

      {/* Hero Content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 40px 60px", position:"relative", zIndex:1 }}>

        {/* Central Icon */}
        <div style={{ width:80, height:80, borderRadius:22, background:`linear-gradient(145deg,${T.rose},${T.roseDeep})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, marginBottom:28, animation:"float 4s ease-in-out infinite", boxShadow:`0 16px 48px ${T.roseGlow}, 0 4px 16px rgba(168,64,64,0.2)` }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8z"/></svg>
        </div>

        {/* Title */}
        <div style={{ textAlign:"center", marginBottom:12, animation:"fadeUp .6s ease" }}>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:52, color:T.ink, letterSpacing:"-0.04em", lineHeight:1.05 }}>
            Sanctii
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:18, color:T.inkMid, marginTop:8, lineHeight:1.6 }}>
            Intelligent healthcare begins before you walk through the door.
          </div>
        </div>

        {/* Subtitle */}
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:T.inkFaint, letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:40, animation:"fadeUp .6s ease .1s both" }}>
          AI-Powered · Real-Time · Secure
        </div>

        {/* Role Selection Cards */}
        <div style={{ display:"flex", gap:24, marginBottom:48, animation:"fadeUp .6s ease .2s both" }}>
          {[
            { role:"patient", icon:<Icons.user/>, title:"I'm a Patient", desc:"Access your health dashboard, book appointments, and get AI-powered triage.", color:T.rose, accent:T.roseDeep },
            { role:"doctor", icon:<Icons.stethoscope/>, title:"I'm a Doctor", desc:"Manage patients, view clinical queues, and receive Presage AI alerts.", color:T.vital, accent:"#3A8A6A" },
          ].map(card => {
            const isHov = hovRole === card.role;
            return (
              <div key={card.role}
                onMouseEnter={() => setHovRole(card.role)}
                onMouseLeave={() => setHovRole(null)}
                onClick={() => onSelectRole(card.role)}
                style={{
                  width:280, padding:"32px 28px", borderRadius:20, cursor:"pointer",
                  background: isHov ? `linear-gradient(155deg,${card.color}12,${card.color}06)` : T.surfaceHard,
                  border: `2px solid ${isHov ? card.color : T.border}`,
                  boxShadow: isHov ? `0 16px 48px ${card.color}25, 0 4px 16px ${card.color}15` : "0 2px 16px rgba(160,80,80,.05)",
                  transition:"all .3s cubic-bezier(.4,0,.2,1)",
                  transform: isHov ? "translateY(-6px)" : "translateY(0)",
                  display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center",
                }}
              >
                <div style={{
                  width:56, height:56, borderRadius:16,
                  background: isHov ? `linear-gradient(145deg,${card.color},${card.accent})` : `${card.color}12`,
                  border: `2px solid ${isHov ? card.color : `${card.color}30`}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color: isHov ? T.white : card.color,
                  transition:"all .3s ease", marginBottom:16,
                }}>
                  {card.icon}
                </div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:18, color:T.ink, letterSpacing:"-0.02em", marginBottom:8 }}>
                  {card.title}
                </div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:T.inkFaint, lineHeight:1.6 }}>
                  {card.desc}
                </div>
                <div style={{
                  marginTop:18, padding:"9px 22px", borderRadius:100,
                  background: isHov ? `linear-gradient(135deg,${card.color},${card.accent})` : "transparent",
                  border: `1.5px solid ${isHov ? "transparent" : card.color}`,
                  color: isHov ? T.white : card.color,
                  fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:12, letterSpacing:"0.02em",
                  transition:"all .3s ease",
                }}>
                  Get Started →
                </div>
              </div>
            );
          })}
        </div>

        {/* Features */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, maxWidth:800, width:"100%", animation:"fadeUp .6s ease .35s both" }}>
          {features.map((f, i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"20px 14px" }}>
              <div style={{ width:38, height:38, borderRadius:11, background:`${f.color}12`, border:`1px solid ${f.color}25`, display:"flex", alignItems:"center", justifyContent:"center", color:f.color, marginBottom:10 }}>
                {f.icon}
              </div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:12, color:T.ink, marginBottom:4 }}>{f.title}</div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.inkFaint, lineHeight:1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ flexShrink:0, height:42, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 40px", borderTop:`1px solid ${T.border}`, background:"rgba(248,240,232,.75)", backdropFilter:"blur(12px)", zIndex:50 }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.inkFaint, letterSpacing:"0.12em", textTransform:"uppercase" }}>© 2026 Sanctii · Medical Intelligence Platform</div>
        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          {[["System","Online",T.vital],["Auth0","Connected",T.vital],["Presage","Ready",T.rose]].map(([k,,c])=>(
            <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:c, animation:"pulse 2s ease-in-out infinite" }}/>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.08em", textTransform:"uppercase" }}>{k}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ role, onBack, onLogin }) {
  const [mode, setMode] = useState("card");
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeRole, setActiveRole] = useState(role);
  const fileRef = useRef();

  const doScan = () => {
    setScanning(true); setScanned(false);
    setTimeout(() => { setScanning(false); setScanned(true); setScanData({ name:"Jordan A. Mitchell", dob:"1989-03-14", cardNo:"HC-4821-0039-JM", province:"Ontario", expiry:"2027-01-01" }); }, 2600);
  };

  return (
    <div style={{ position:"fixed", inset:0, display:"flex", overflow:"hidden" }}>
      <BgOrbs/>
      {/* Left brand */}
      <div style={{ width:"44%", position:"relative", overflow:"hidden", background:`linear-gradient(160deg,${T.roseDeep} 0%,#7A2525 100%)`, display:"flex", flexDirection:"column", justifyContent:"center", padding:"56px 48px" }}>
        <div style={{ position:"absolute", right:-80, top:"50%", transform:"translateY(-50%)", opacity:.05, color:T.white, fontSize:440, lineHeight:1, fontWeight:800, userSelect:"none", fontFamily:"'Outfit',sans-serif" }}>+</div>
        <EcgStrip bottom="8%" opacity={.18} color={T.white}/>
        <button onClick={onBack} style={{ background:"none", border:"1px solid rgba(255,255,255,.2)", cursor:"pointer", color:"rgba(255,255,255,.75)", fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:12, padding:"8px 18px", borderRadius:100, width:"fit-content", marginBottom:48, transition:"all .2s", letterSpacing:"0.02em" }}>← Back to Home</button>
        <div style={{ animation:"slideR .6s ease" }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", color:T.white, marginBottom:18, backdropFilter:"blur(8px)" }}>
            <Icons.cross/>
          </div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:42, color:T.white, letterSpacing:"-0.04em", lineHeight:1.05, marginBottom:10 }}>Welcome<br/>to Sanctii</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:16, color:"rgba(255,255,255,.65)", lineHeight:1.65, marginBottom:44 }}>
            Intelligent healthcare begins<br/>before you walk through the door.
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
          {[[<Icons.shield/>,"Auth0 secured authentication"],[<Icons.card/>,"Instant health card scanning"],[<Icons.heartbeat/>,"AI-powered triage with Presage"],[<Icons.mapPin/>,"Real-time hospital routing"]].map(([ic,text],i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, animation:`slideR .6s ease ${.1+i*.1}s both`, opacity:0 }}>
              <div style={{ color:"rgba(255,255,255,.55)", flexShrink:0 }}>{ic}</div>
              <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:"rgba(255,255,255,.75)", fontWeight:400 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"44px 52px", background:T.bg, overflowY:"auto" }}>
        <div style={{ width:"100%", maxWidth:400, animation:"fadeUp .5s ease" }}>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:28, color:T.ink, letterSpacing:"-0.03em", marginBottom:4 }}>Sign in</div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:14, color:T.inkFaint, marginBottom:26 }}>Access your Sanctii health dashboard</div>

          {/* Role */}
          <div style={{ display:"flex", gap:5, marginBottom:22, padding:4, background:T.bgDeep, borderRadius:12 }}>
            {["patient","doctor","admin"].map(r=>(
              <button key={r} onClick={()=>setActiveRole(r)} style={{ flex:1, padding:"8px 0", border:"none", cursor:"pointer", borderRadius:8, fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:12, background:activeRole===r?T.white:"transparent", color:activeRole===r?T.rose:T.inkFaint, boxShadow:activeRole===r?"0 2px 8px rgba(160,80,80,.12)":"none", transition:"all .2s", textTransform:"capitalize" }}>{r}</button>
            ))}
          </div>

          {/* Mode tabs */}
          <div style={{ display:"flex", marginBottom:20, borderBottom:`2px solid ${T.bgDeep}` }}>
            {[["card","Health Card"],["manual","Email & Password"]].map(([m,label])=>(
              <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:"10px 0", border:"none", background:"transparent", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:12, color:mode===m?T.rose:T.inkFaint, borderBottom:`2px solid ${mode===m?T.rose:"transparent"}`, marginBottom:-2, transition:"all .2s" }}>{label}</button>
            ))}
          </div>

          {mode==="card"&&(
            <div style={{ animation:"fadeUp .3s ease" }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={doScan}/>
              <div onClick={()=>!scanning&&fileRef.current.click()} style={{ borderRadius:16, overflow:"hidden", cursor:"pointer", border:`2px dashed ${scanned?T.vital:scanning?T.rose:T.borderStrong}`, background:scanned?T.vitalPale:scanning?T.roseTint:T.bgDeep, minHeight:200, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", transition:"all .3s ease", padding:24 }}>
                {scanning&&<div style={{ position:"absolute", left:"5%", right:"5%", height:2, background:`linear-gradient(90deg,transparent,${T.rose} 30%,${T.rose} 70%,transparent)`, boxShadow:`0 0 12px ${T.roseGlow}`, animation:"scanLine 1.4s ease-in-out infinite" }}/>}
                {!scanning&&!scanned&&<>
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
                  <button className="btn-ghost" onClick={e=>{e.stopPropagation();doScan();}} style={{ fontSize:11, padding:"7px 18px" }}>Demo Scan</button>
                </>}
                {scanning&&<div style={{ textAlign:"center", padding:"16px 0" }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", border:`2px solid ${T.rosePale}`, borderTopColor:T.rose, animation:"spin .8s linear infinite", margin:"0 auto 14px" }}/>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:14, color:T.ink }}>Scanning card...</div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkFaint, marginTop:3 }}>Reading health card data via OCR</div>
                </div>}
                {scanned&&scanData&&<div style={{ width:"100%", animation:"fadeUp .4s ease" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                    <div style={{ width:22, height:22, borderRadius:"50%", background:T.vital, display:"flex", alignItems:"center", justifyContent:"center" }}><Icons.check/></div>
                    <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:13, color:T.vital }}>Card Verified Successfully</span>
                  </div>
                  <div style={{ background:T.white, borderRadius:10, padding:"12px 16px", display:"flex", flexDirection:"column", gap:7 }}>
                    {[["Name",scanData.name],["Date of Birth",scanData.dob],["Card Number",scanData.cardNo],["Province",scanData.province],["Expiry",scanData.expiry]].map(([k,v])=>(
                      <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.inkFaint, letterSpacing:"0.1em", textTransform:"uppercase" }}>{k}</span>
                        <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, color:T.ink }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>}
              </div>
              {scanned&&<button className="btn-primary" onClick={()=>onLogin(activeRole)} style={{ width:"100%", marginTop:12, padding:"13px 0", fontSize:14 }}>Continue with Health Card →</button>}
            </div>
          )}

          {mode==="manual"&&(
            <div style={{ animation:"fadeUp .3s ease", display:"flex", flexDirection:"column", gap:13 }}>
              {[["Email address","email",email,setEmail,"you@example.com"],["Password","password",password,setPassword,"••••••••"]].map(([label,type,val,setter,ph])=>(
                <div key={label}>
                  <label style={{ fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:12, color:T.inkMid, display:"block", marginBottom:6 }}>{label}</label>
                  <input type={type} value={val} onChange={e=>setter(e.target.value)} placeholder={ph}
                    style={{ width:"100%", padding:"12px 16px", borderRadius:10, border:`1.5px solid ${T.border}`, background:T.bgDeep, fontFamily:"'Outfit',sans-serif", fontSize:14, color:T.ink, outline:"none", transition:"border-color .2s" }}
                    onFocus={e=>{e.target.style.borderColor=T.rose;e.target.style.background=T.surfaceHard;}}
                    onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.background=T.bgDeep;}}
                  />
                </div>
              ))}
              <button className="btn-primary" onClick={()=>onLogin(activeRole)} style={{ width:"100%", padding:"13px 0", fontSize:14, marginTop:4 }}>Sign In →</button>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ flex:1, height:1, background:T.border }}/><span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.inkFaint, letterSpacing:"0.12em", textTransform:"uppercase" }}>or</span><div style={{ flex:1, height:1, background:T.border }}/>
              </div>
              <button onClick={()=>onLogin(activeRole)} style={{ width:"100%", padding:"12px 0", borderRadius:10, border:`1.5px solid ${T.border}`, background:T.surfaceHard, cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:13, color:T.ink, display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all .2s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.rose;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;}}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:T.rose, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, fontSize:11, fontWeight:700 }}>A</div>
                Continue with Auth0
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("hero");
  const [role, setRole] = useState("patient");

  if (view === "app") return <Landing onLogout={() => setView("hero")} />;
  if (view === "login") return <LoginPage role={role} onBack={() => setView("hero")} onLogin={() => setView("app")} />;

  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", position:"relative" }}>
      <GlobalStyle/>
      <div style={{ position:"fixed", top:"-50%", left:"-50%", width:"200%", height:"200%", backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, pointerEvents:"none", zIndex:9999, opacity:.22 }}/>
      <HeroPage
        onSelectRole={(r) => { setRole(r); setView("login"); }}
        onSignIn={() => setView("login")}
      />
    </div>
  );
}
