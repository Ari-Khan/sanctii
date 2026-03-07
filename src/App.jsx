import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import ProtectedRoute from "./auth/ProtectedRoute";
import { getUserRoles, ROLE } from "./auth/roles";
import { Icons } from "./theme";
import { BgOrbs, EcgStrip, Card } from "./components/SharedUI";
import HospitalHologram from "./components/Hologram";
import { getPersistedRole, setPersistedRole } from "./auth/persistedRole";
import PresagePage from "./pages/Presage";
import ScannerPage from "./pages/ScannerPage";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:           "#F8F0E8",
  bgDeep:       "#F0E4D4",
  surfaceHard:  "#FFFAF4",
  border:       "rgba(200,160,140,0.3)",  
  borderStrong: "rgba(180,100,100,0.45)",
  rose:         "#D4706A",
  roseMid:      "#C05858",
  roseDeep:     "#A84040",
  rosePale:     "#EEBABA",
  roseGlow:     "rgba(212,112,106,0.35)",
  roseTint:     "rgba(212,112,106,0.08)",
  vital:        "#5BAA8A",
  vitalPale:    "rgba(91,170,138,0.15)",
  amber:        "#D4974A",
  ink:          "#2A1818",
  inkMid:       "#6B4040",
  inkFaint:     "#A08070",
  white:        "#FFFCF8",
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap');

    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    html, body, #root { width:100%; height:100%; min-height:100vh; overflow:hidden; }
    body { font-family:'Outfit',sans-serif; background:${T.bg}; color:${T.ink}; -webkit-font-smoothing:antialiased; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:${T.rosePale}; border-radius:4px; }

    @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes slideR   { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
    @keyframes ecgLoop  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes ecgDraw  { from{stroke-dashoffset:600} to{stroke-dashoffset:0} }
    @keyframes pulse    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:.8} }
    @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes pathAnim { from{stroke-dashoffset:1200;opacity:0} to{stroke-dashoffset:0;opacity:1} }
    @keyframes nodeIn   { from{opacity:0;transform:scale(.3)} to{opacity:1;transform:scale(1)} }
    @keyframes scanLine { 0%{top:8%;opacity:.9} 50%{top:88%;opacity:.4} 100%{top:8%;opacity:.9} }
    @keyframes ripple   { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.4);opacity:0} }
    @keyframes breathe  { 0%,100%{box-shadow:0 0 0 0 ${T.roseGlow}} 50%{box-shadow:0 0 0 14px transparent} }

    .btn-primary {
      font-family:'Outfit',sans-serif; font-weight:600; font-size:13px;
      letter-spacing:.03em; padding:11px 28px; border-radius:100px; border:none;
      background:linear-gradient(135deg,${T.rose} 0%,${T.roseDeep} 100%);
      color:${T.white}; cursor:pointer; transition:all .25s ease;
    }
    .btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px ${T.roseGlow}; }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; transform:none; }
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

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────
function Stat({ label, value, sub, color }) {
  return (
    <Card accent={color} style={{ textAlign:"center", padding:"18px 12px" }}>
      <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:32, color:color||T.ink, letterSpacing:"-0.03em" }}>{value}</div>
      {sub && <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:color?`${color}99`:T.inkFaint, marginTop:1 }}>{sub}</div>}
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:"0.14em", textTransform:"uppercase", color:T.inkFaint, marginTop:5 }}>{label}</div>
    </Card>
  );
}

function SHead({ children }) {
  return (
    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:"0.18em", textTransform:"uppercase", color:T.inkFaint, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:1, background:T.border }}/>{children}<div style={{ flex:1, height:1, background:T.border }}/>
    </div>
  );
}

function VChart() {
  const pts=[72,75,71,74,73,76,72,74,70,73,75,72];
  const max=Math.max(...pts),min=Math.min(...pts),W=150,H=38;
  const y=v=>H-((v-min)/(max-min+1))*H;
  const d=pts.map((v,i)=>`${i===0?"M":"L"} ${(i/(pts.length-1))*W} ${y(v)}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.vital} stopOpacity=".3"/><stop offset="100%" stopColor={T.vital} stopOpacity="0"/></linearGradient></defs>
      <path d={d+` L ${W} ${H} L 0 ${H} Z`} fill="url(#vg)"/>
      <path d={d} fill="none" stroke={T.vital} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ position:"fixed", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:T.bg }}>
      <BgOrbs/>
      <EcgStrip bottom="10%" opacity={0.09}/>
      <div style={{ zIndex:1, textAlign:"center" }}>
        <div style={{ width:52, height:52, borderRadius:14, background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, margin:"0 auto 20px", animation:"breathe 2s ease-in-out infinite" }}>
          <Icons.cross/>
        </div>
        <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:28, color:T.ink, letterSpacing:"-0.03em", marginBottom:16 }}>Sanctii</div>
        <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
          {[0,1,2].map(i=>(
            <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:T.rose, animation:`pulse 1.2s ease ${i*0.2}s infinite` }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN PAGE (/login) ──────────────────────────────────────────────────────
function LoginPage() {
  const { loginWithRedirect, isLoading, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  // If already logged in, bounce straight to role selection
  useEffect(() => {
    if (isAuthenticated) {
      const persistedRole = getPersistedRole();
      if (persistedRole) navigate("/app", { replace: true });
      else navigate("/role", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const signIn = (connection) => {
    loginWithRedirect({
      authorizationParams: {
        ...(connection && { connection }),
      },
      appState: { returnTo: "/role" },
    });
  };

  return (
    <div style={{ position:"fixed", inset:0, display:"flex", overflow:"hidden" }}>
      <BgOrbs/>

      {/* ── LEFT BRAND PANEL ── */}
      <div style={{ width:"44%", position:"relative", overflow:"hidden", background:`linear-gradient(160deg,${T.roseDeep} 0%,#7A2525 100%)`, display:"flex", flexDirection:"column", justifyContent:"center", padding:"56px 48px" }}>
        {/* Watermark cross */}
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

        {/* Feature list */}
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

        {/* Live vitals badge strip */}
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

          {/* ── Auth buttons ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:11, animation:"fadeUp .3s ease" }}>

            {/* Auth0 Universal Login */}
            <button className="btn-primary"
              onClick={() => signIn(null)}
              disabled={isLoading}
              style={{ width:"100%", padding:"14px 0", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}
            >
              <Icons.shield/>
              {isLoading ? "Connecting…" : "Continue with Auth0 →"}
            </button>

            {/* Google Social */}
            <button
              onClick={() => signIn("google-oauth2")}
              disabled={isLoading}
              style={{ width:"100%", padding:"13px 0", borderRadius:100, border:`1.5px solid ${T.border}`, background:T.surfaceHard, cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:13, color:T.ink, display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all .2s" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.rose; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; }}
            >
              <Icons.google/> Continue with Google
            </button>

            <div style={{ marginTop:8, fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.12em", textTransform:"uppercase", textAlign:"center", lineHeight:1.8 }}>
              Sign in as a patient or doctor — you’ll choose your role after logging in.
            </div>
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

// ─── MAZE CONFIG ──────────────────────────────────────────────────────────────
const NODES = {
  center:    { x:50, y:50, label:"Health Center", icon:"cross", isCenter:true, col:T.roseMid },
  patient:   { x:26, y:25, label:"Patient Portal", icon:"user", path:"/patient", col:T.rose },
  doctor:    { x:76, y:25, label:"Doctor Portal", icon:"stethoscope", path:"/doctor", col:T.roseDeep },
  schedule:  { x:26, y:76, label:"Scheduling", icon:"calendar", path:"/schedule", col:T.amber },
  presage:   { x:(50-18)+50, y:50-8, label:"Presage AI", icon:"brain", path:"/presage", col:T.roseMid },
  hospital:  { x:38, y:80, label:"Find Hospital", icon:"mapPin", path:"/hospital", col:T.vital },
  rooms:     { x:76, y:76, label:"Room Map", icon:"grid", path:"/rooms", col:T.vital },
};

const EDGES = [
  { from:"center", to:"patient" },
  { from:"center", to:"doctor" },
  { from:"center", to:"hospital" },
  { from:"center", to:"rooms" },
  { from:"center", to:"presage" },
  { from:"center", to:"schedule" },
  
  { from:"patient", to:"presage" },
  { from:"doctor",  to:"schedule" },
  { from:"hospital", to:"rooms" },
];

const PATIENT_EDGES = [
  { from:"center", to:"patient" },
  { from:"center", to:"hospital" },
  { from:"center", to:"presage" },
  { from:"patient", to:"presage" },
  { from:"patient", to:"hospital" },
  { from:"hospital", to:"presage" },
];

const DOCTOR_EDGES = [
  { from:"center", to:"doctor" },
  { from:"center", to:"schedule" },
  { from:"center", to:"rooms" },
  { from:"center", to:"patient" },
  { from:"doctor", to:"patient" },
  { from:"doctor", to:"rooms" },
  { from:"rooms", to:"schedule" },
  { from:"schedule", to:"patient" },

];

const DECOS = [
  "M 5 5 L 15 5", "M 5 5 L 5 15", "M 95 5 L 85 5", "M 95 5 L 95 15",
  "M 5 95 L 15 95", "M 5 95 L 5 85", "M 95 95 L 85 95", "M 95 95 L 95 85",
];

function bfs(start, end, edgesToUse = EDGES) {
  const q=[[start]], seen=new Set([start]);
  while(q.length){
    const p=q.shift(), curr=p[p.length-1];
    if(curr===end) return p;
    (edgesToUse.filter(e=>e.from===curr||e.to===curr)).forEach(e=>{
      const next=e.from===curr?e.to:e.from;
      if(!seen.has(next)){ seen.add(next); q.push([...p,next]); }
    });
  }
  return [];
}

function makeSVGPath(path) {
  if(!path||path.length<2) return "";
  let d="";
  for(let i=0; i<path.length-1; i++){
    const f=NODES[path[i]], t=NODES[path[i+1]];
    const e=EDGES.find(e=>(e.from===path[i]&&e.to===path[i+1])||(e.to===path[i]&&e.from===path[i+1]));
    if(i===0) d+=`M ${f.x} ${f.y}`;
    if(e?.wp){
      const rev=e.to===path[i];
      const pts=rev?[...e.wp].reverse():e.wp;
      pts.forEach(w=>d+=` L ${w.x} ${w.y}`);
    }
    d+=` L ${t.x} ${t.y}`;
  }
  return d;
}

// ─── MAZE PAGE ────────────────────────────────────────────────────────────────
function MazePage() {
  const { user, logout } = useAuth0();
  const navigate = useNavigate();
  const [hov, setHov] = useState(null);
  const [path, setPath] = useState([]);
  const roles = getUserRoles(user);
  const persistedRole = getPersistedRole();
  const activeRole = persistedRole || roles[0] || null;

  const activeEdges = (() => {
    if (activeRole === ROLE.PATIENT) return PATIENT_EDGES;
    if (activeRole === ROLE.DOCTOR) return DOCTOR_EDGES;
    return EDGES;
  })();

  useEffect(()=>{ setPath(hov&&hov!=="center" ? bfs("center", hov, activeEdges) : []); }, [hov, activeEdges]);

  const pd = makeSVGPath(path);
  const ac = hov ? NODES[hov]?.col||T.rose : T.rose;

  // Adjust maze buttons (nodes) based on active role
  const visibleNodeKeys = (() => {
    if (activeRole === ROLE.PATIENT) {
      return ["center","patient","hospital","presage"];
    }
    if (activeRole === ROLE.DOCTOR) {
      return ["center","rooms","schedule","patient","doctor"];
    }
    return Object.keys(NODES);
  })();

  const handleLogout = () => logout({ logoutParams: { returnTo: window.location.origin } });

  return (
    <div style={{ position:"fixed", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
      <BgOrbs/>
      <EcgStrip bottom={0} opacity={.09}/>
      <EcgStrip top="8%" opacity={.05} color={T.vital}/>

      {/* ── Top Nav ── */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:66, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", borderBottom:`1px solid ${T.border}`, background:"rgba(248,240,232,.9)", backdropFilter:"blur(20px)", zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, animation:"breathe 3s ease-in-out infinite", flexShrink:0 }}>
            <Icons.cross/>
          </div>
          <div>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:20, color:T.ink, letterSpacing:"-0.03em" }}>Sanctii</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.14em", textTransform:"uppercase", marginTop:-2 }}>Medical Intelligence Platform</div>
          </div>
        </div>

        {/* Vitals strip */}
        <div style={{ display:"flex", alignItems:"center", gap:20, padding:"7px 18px", borderRadius:100, background:"rgba(91,170,138,.08)", border:"1px solid rgba(91,170,138,.25)" }}>
          {[["♥","72 bpm",T.vital],["⚡","98% SpO₂",T.rose],["🌡","36.6°C",T.amber]].map(([ic,val,c])=>(
            <div key={val} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ fontSize:10 }}>{ic}</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:c, letterSpacing:"0.04em" }}>{val}</span>
            </div>
          ))}
        </div>

        {/* User chip + role + actions */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {/* Role badge (from persisted role or token) */}
          {activeRole && (
            <div style={{ padding:"4px 10px", borderRadius:100, background:`${T.rose}15`, border:`1px solid ${T.rose}35`, fontFamily:"'DM Mono',monospace", fontSize:8, color:T.rose, letterSpacing:"0.1em", textTransform:"uppercase" }}>
              {activeRole}
            </div>
          )}
          {/* Avatar chip */}
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 12px 5px 5px", borderRadius:100, background:T.bgDeep, border:`1px solid ${T.border}` }}>
            {user?.picture
              ? <img src={user.picture} alt="" style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover" }}/>
              : <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, fontSize:12, fontWeight:700 }}>
                  {(user?.name||user?.email||"U")[0].toUpperCase()}
                </div>
            }
            <div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:12, color:T.ink, lineHeight:1 }}>{user?.name||user?.email?.split("@")[0]}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.06em", marginTop:1 }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={()=>navigate("/role")} className="btn-ghost" style={{ fontSize:11, padding:"8px 14px", display:"flex", alignItems:"center", gap:4 }}>
            Change role
          </button>
          <button onClick={handleLogout} className="btn-ghost" style={{ fontSize:11, padding:"8px 16px", display:"flex", alignItems:"center", gap:6 }}>
            <Icons.logout/> Sign Out
          </button>
        </div>
      </div>

      {/* ── Maze Canvas ── */}
      <div style={{ position:"relative", width:"min(76vw,80vh)", height:"min(76vw,80vh)", maxWidth:620, maxHeight:620, marginTop:16, zIndex:10 }}>
        <svg viewBox="0 0 100 100" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <marker id="arr" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <polygon points="0 0,5 2.5,0 5" fill={ac} opacity=".9"/>
            </marker>
          </defs>
          {DECOS.map((d,i)=><path key={i} d={d} fill="none" stroke={T.border} strokeWidth=".7" strokeLinecap="round" opacity=".8"/>)}
          {activeEdges.map((e,i)=>{ const f=NODES[e.from],t=NODES[e.to]; let d=`M ${f.x} ${f.y}`; (e.wp||[]).forEach(w=>{ d+=` L ${w.x} ${w.y}`; }); d+=` L ${t.x} ${t.y}`; return <path key={i} d={d} fill="none" stroke={T.border} strokeWidth=".6" strokeDasharray="1.5 2" opacity=".55"/>; })}
          {pd && <>
            <path d={pd} fill="none" stroke={ac} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity=".15" filter="url(#glow)"/>
            <path d={pd} fill="none" stroke={ac} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arr)" strokeDasharray="400" style={{ animation:"pathAnim .45s cubic-bezier(.4,0,.2,1) forwards" }}/>
          </>}
          {path.map((key,i)=>{ const n=NODES[key]; return <circle key={key} cx={n.x} cy={n.y} r={i===0?3.5:2.5} fill={i===0?T.roseDeep:ac} opacity=".5" style={{ animation:`nodeIn .3s ease ${i*.07}s both` }}/>; })}
        </svg>

        {Object.entries(NODES)
          .filter(([key]) => visibleNodeKeys.includes(key))
          .map(([key,node])=>{
          const isCenter=node.isCenter, isHov=hov===key, inPath=path.includes(key), col=node.col||T.rose, IC=Icons[node.icon];
          return (
            <div key={key}
              onMouseEnter={()=>!isCenter&&setHov(key)}
              onMouseLeave={()=>setHov(null)}
              onClick={()=>{
                if (isCenter) return;
                // Override destinations for role-specific buttons
                if (activeRole === ROLE.PATIENT) {
                  if (key === "patient") navigate("/patient");
                  else if (key === "hospital") navigate("/hospital");
                  else if (key === "presage") navigate("/presage");
                  else if (node.path) navigate(node.path);
                  return;
                }
                if (activeRole === ROLE.DOCTOR) {
                  if (key === "rooms") navigate("/rooms");
                  else if (key === "schedule") navigate("/schedule");
                  else if (key === "patient") navigate("/doctor"); // patient info by severity
                  else if (key === "doctor") navigate("/doctor");  // doctor information
                  else if (node.path) navigate(node.path);
                  return;
                }
                if (node.path) navigate(node.path);
              }}
              style={{ position:"absolute", left:`${node.x}%`, top:`${node.y}%`, transform:"translate(-50%,-50%)", zIndex:20, cursor:isCenter?"default":"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}
            >
              {isHov && <div style={{ position:"absolute", width:isCenter?84:60, height:isCenter?84:60, borderRadius:"50%", border:`1.5px solid ${col}`, animation:"ripple 1s ease-out infinite", pointerEvents:"none" }}/>}
              <div style={{ width:isCenter?66:50, height:isCenter?66:50, borderRadius:isCenter?"18px":"14px", background:isHov||isCenter?`linear-gradient(145deg,${col}ee,${col}aa)`:inPath?`linear-gradient(145deg,${col}35,${col}18)`:T.surfaceHard, border:`${isHov?2:1.5}px solid ${isHov||inPath?col:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:isHov||isCenter?T.white:inPath?col:T.inkFaint, boxShadow:isHov?`0 12px 32px ${col}55,0 4px 12px ${col}33`:inPath?`0 0 14px ${col}30`:"0 2px 10px rgba(160,80,80,.06)", transition:"all .25s cubic-bezier(.4,0,.2,1)", transform:isHov?"scale(1.14)":"scale(1)", animation:isCenter?"float 4s ease-in-out infinite":"none", backdropFilter:"blur(12px)" }}>
                {IC && <IC/>}
              </div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:isCenter?700:500, fontSize:isCenter?11:9, color:isHov?col:inPath?col:isCenter?T.inkMid:T.inkFaint, textAlign:"center", whiteSpace:"nowrap", transition:"color .2s", letterSpacing:isCenter?"-0.01em":"0.02em" }}>
                {activeRole === ROLE.PATIENT && key === "patient" && "Patient information"}
                {activeRole === ROLE.PATIENT && key === "hospital" && "Nearest hospital map"}
                {activeRole === ROLE.PATIENT && key === "presage" && "Presage"}
                {activeRole === ROLE.DOCTOR && key === "rooms" && "Room assignment"}
                {activeRole === ROLE.DOCTOR && key === "schedule" && "Scheduling"}
                {activeRole === ROLE.DOCTOR && key === "patient" && "Patient info (severity)"}
                {activeRole === ROLE.DOCTOR && key === "doctor" && "Doctor information"}
                {!activeRole && node.label}
                {activeRole && !["patient","hospital","presage","rooms","schedule","doctor"].includes(key) && node.label}
              </div>
              {isHov && <div style={{ position:"absolute", top:"calc(100% + 8px)", background:T.ink, color:T.white, padding:"5px 12px", borderRadius:8, fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:"0.1em", textTransform:"uppercase", whiteSpace:"nowrap", animation:"fadeIn .15s ease", boxShadow:"0 4px 16px rgba(0,0,0,.2)", zIndex:30 }}>Click to enter →</div>}
            </div>
          );
        })}
      </div>

      {/* ── Status Bar ── */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:42, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", borderTop:`1px solid ${T.border}`, background:"rgba(248,240,232,.75)", backdropFilter:"blur(12px)", zIndex:50 }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.inkFaint, letterSpacing:"0.12em", textTransform:"uppercase", opacity:hov?0:1, transition:"opacity .3s" }}>Hover a destination · Optimal path · Click to enter</div>
        {hov&&hov!=="center" && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:ac, letterSpacing:"0.1em", textTransform:"uppercase", animation:"fadeIn .2s ease" }}>◈ {path.length-1} hop{path.length!==2?"s":""} to {NODES[hov]?.label}</div>}
        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          {[["System","Online",T.vital],["Auth0","Active",T.vital],["Presage","Ready",T.rose]].map(([k,,c])=>(
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

// ─── ROLE SELECTION (after login) ──────────────────────────────────────────────
function RoleSelectionPage() {
  const { user } = useAuth0();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(getPersistedRole() || ROLE.PATIENT);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    setSaving(true);
    try {
      // Persist to MongoDB
      await fetch("http://localhost:3001/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          role: selected,
          name: user?.name,
          lastLogin: new Date()
        })
      });

      setPersistedRole(selected);
      navigate("/app", { replace: true });
    } catch (err) {
      console.error("Failed to save role:", err);
      // Fallback to local storage if API fails
      setPersistedRole(selected);
      navigate("/app", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, display:"flex", overflow:"hidden" }}>
      <BgOrbs/>
      <EcgStrip bottom="6%" opacity={0.08}/>

      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"44px 52px", background:T.bg }}>
        <div style={{ width:"100%", maxWidth:520, animation:"fadeUp .5s ease" }}>
          <div style={{ marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white }}>
              <Icons.cross/>
            </div>
            <div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:22, color:T.ink, letterSpacing:"-0.03em" }}>Welcome, {user?.name || user?.email?.split("@")[0] || "there"}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.14em", textTransform:"uppercase", marginTop:2 }}>
                Choose how you’d like to explore Sanctii
              </div>
            </div>
          </div>

          <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:14, color:T.inkFaint, marginBottom:24 }}>
            Pick the role that best describes you today. You can change this later from the maze header.
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Card
              onClick={()=>setSelected(ROLE.PATIENT)}
              accent={T.rose}
              style={{
                padding:22,
                borderColor: selected===ROLE.PATIENT ? T.roseMid : undefined,
                boxShadow: selected===ROLE.PATIENT ? `0 10px 30px ${T.roseGlow}` : undefined,
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:`${T.rose}18`, display:"flex", alignItems:"center", justifyContent:"center", color:T.rose }}>
                  <Icons.user/>
                </div>
                <div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, color:T.ink }}>I’m a patient</div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.inkFaint }}>View your vitals, appointments, and Presage insights.</div>
                </div>
              </div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.rose, letterSpacing:"0.12em", textTransform:"uppercase" }}>Continue to Sanctii maze →</div>
            </Card>

            <Card
              onClick={()=>setSelected(ROLE.DOCTOR)}
              accent={T.vital}
              style={{
                padding:22,
                borderColor: selected===ROLE.DOCTOR ? T.vital : undefined,
                boxShadow: selected===ROLE.DOCTOR ? `0 10px 30px rgba(91,170,138,.35)` : undefined,
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:`${T.vital}18`, display:"flex", alignItems:"center", justifyContent:"center", color:T.vital }}>
                  <Icons.stethoscope/>
                </div>
                <div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, color:T.ink }}>I’m a doctor</div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.inkFaint }}>Access clinical dashboards, queues, and alerts.</div>
                </div>
              </div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.vital, letterSpacing:"0.12em", textTransform:"uppercase" }}>Doctor tools & dashboards</div>
            </Card>
          </div>

          <button
            className="btn-primary"
            onClick={handleContinue}
            disabled={saving}
            style={{ width:"100%", marginTop:20, padding:"13px 0", fontSize:14, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving..." : "Continue to Sanctii maze →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE WRAPPER (shared by all portals) ─────────────────────────────────────
function PageWrap({ children, title, icon, subtitle, badge }) {
  const navigate = useNavigate();
  return (
    <div style={{ position:"fixed", inset:0, display:"flex", flexDirection:"column", background:T.bg, overflow:"hidden" }}>
      <BgOrbs/>
      <EcgStrip bottom={0} opacity={.06}/>
      <div style={{ position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", gap:14, padding:"0 30px", height:65, background:"rgba(248,240,232,.9)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <button className="btn-ghost" onClick={()=>navigate("/app")} style={{ padding:"7px 16px", fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
          ← Maze
        </button>
        <div style={{ width:1, height:26, background:T.border }}/>
        <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, flexShrink:0 }}>{icon}</div>
        <div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:16, color:T.ink, letterSpacing:"-0.01em" }}>{title}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.12em", textTransform:"uppercase" }}>{subtitle}</div>
        </div>
        {badge && <div style={{ marginLeft:8 }}>{badge}</div>}
        <div style={{ marginLeft:"auto", fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:13, color:T.inkFaint }}>Sanctii</div>
      </div>
      <div style={{ flex:1, overflow:"auto", padding:"26px 30px", position:"relative", zIndex:1 }}>
        <div style={{ animation:"fadeUp .4s ease" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── PATIENT PORTAL (/patient) ────────────────────────────────────────────────
function PatientPage() {
  const { user } = useAuth0();
  const navigate = useNavigate();
  const displayName = user?.name || user?.email?.split("@")[0] || "Patient";
  const initials = displayName.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);

  return (
    <PageWrap title="Patient Portal" icon={<Icons.user/>} subtitle="Personal health dashboard"
      badge={<div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:100, background:"rgba(91,170,138,.1)", border:"1px solid rgba(91,170,138,.25)" }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:T.vital, animation:"pulse 1.5s ease infinite" }}/><span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.vital, letterSpacing:"0.12em", textTransform:"uppercase" }}>Active</span>
      </div>}
    >
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        <button
          className="btn-primary"
          style={{ fontSize:12, padding:"8px 18px" }}
          onClick={()=>navigate("/patient")}
        >
          Patient information
        </button>
        <button
          className="btn-ghost"
          style={{ fontSize:12, padding:"8px 18px" }}
          onClick={()=>navigate("/hospital")}
        >
          Nearest hospital map
        </button>
        <button
          className="btn-ghost"
          style={{ fontSize:12, padding:"8px 18px" }}
          onClick={()=>navigate("/presage")}
        >
          Presage
        </button>
        <button
          className="btn-primary"
          style={{ fontSize:12, padding:"8px 18px", background: "linear-gradient(135deg, #A84040 0%, #6B4040 100%)" }}
          onClick={()=>navigate("/patient/scanner")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icons.card/> Scan Health Card
          </div>
        </button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        <Stat label="Next Appointment" value="Mar 12" sub="09:30 AM" color={T.rose}/>
        <Stat label="Active Scripts" value="3" color={T.roseMid}/>
        <Stat label="Last Visit" value="Feb 18" sub="Dr. Roberts"/>
        <Stat label="Health Score" value="87" sub="Excellent" color={T.vital}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Card>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, color:T.ink }}>Live Vitals</div>
              <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:100, background:T.vitalPale, border:`1px solid rgba(91,170,138,.3)` }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:T.vital, animation:"pulse 1.5s ease infinite" }}/><span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.vital, letterSpacing:"0.1em", textTransform:"uppercase" }}>Live</span>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {[["Heart Rate","72","bpm",T.rose,<Icons.heart/>],["Blood Pressure","118/76","mmHg",T.vital,<Icons.heartbeat/>],["SpO₂","98","%","#6B8FDF",<Icons.shield/>]].map(([l,v,u,c,ic])=>(
                <div key={l} style={{ padding:"12px 10px", background:`${c}08`, borderRadius:12, border:`1px solid ${c}20` }}>
                  <div style={{ color:`${c}88`, marginBottom:5 }}>{ic}</div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:22, color:c, letterSpacing:"-0.02em" }}>{v}<span style={{ fontSize:10, fontWeight:400, marginLeft:2 }}>{u}</span></div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:T.inkFaint, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.1em", textTransform:"uppercase" }}>7-day HR trend</span>
              <VChart/>
            </div>
          </Card>
          <Card>
            <SHead>Recent Activity</SHead>
            {[{date:"Feb 18",event:"General Checkup",doctor:"Dr. Roberts",type:"visit"},{date:"Feb 02",event:"Blood Work Results",doctor:"Lab Dept.",type:"lab"},{date:"Jan 29",event:"Prescription Renewed",doctor:"Dr. Roberts",type:"rx"},{date:"Jan 15",event:"Chest X-Ray",doctor:"Radiology",type:"imaging"}].map((item,i)=>{
              const c={visit:T.vital,lab:T.rose,rx:T.amber,imaging:"#6B8FDF"}[item.type];
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:i<3?`1px solid ${T.border}`:"none" }}>
                  <div style={{ width:34, height:34, borderRadius:10, background:`${c}15`, display:"flex", alignItems:"center", justifyContent:"center", color:c, flexShrink:0 }}>
                    {item.type==="visit"?<Icons.stethoscope/>:item.type==="lab"?<Icons.heartbeat/>:item.type==="imaging"?<Icons.grid/>:<Icons.shield/>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:13, color:T.ink }}>{item.event}</div>
                    <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.inkFaint, marginTop:1 }}>{item.doctor}</div>
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.inkFaint }}>{item.date}</div>
                </div>
              );
            })}
          </Card>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Card style={{ background:`linear-gradient(145deg,${T.rose}08,${T.surfaceHard})`, borderColor:`${T.rose}25` }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
              {user?.picture
                ? <img src={user.picture} alt="" style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", border:`2px solid ${T.rose}30` }}/>
                : <div style={{ width:48, height:48, borderRadius:"50%", background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, fontSize:18, fontWeight:800 }}>{initials}</div>
              }
              <div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, color:T.ink }}>{displayName}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:2 }}>HC-4821-0039-JM</div>
              </div>
            </div>
            {[["Blood Type","A+"],["Weight","74 kg"],["Height","178 cm"],["Allergies","Penicillin"]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkFaint }}>{k}</span>
                <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:12, color:T.ink }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card accent={T.rose} style={{ borderColor:`${T.rose}28` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{ color:T.rose }}><Icons.brain/></div>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.rose, letterSpacing:"0.12em", textTransform:"uppercase" }}>Presage AI Insight</span>
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:14, color:T.ink, lineHeight:1.65 }}>"Your vitals look stable. Consider scheduling your annual eye exam — last recorded 14 months ago."</div>
            <div style={{ marginTop:10, fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.1em", textTransform:"uppercase" }}>Confidence: 94% · Updated today</div>
          </Card>
        </div>
      </div>
    </PageWrap>
  );
}

// ─── DOCTOR PORTAL (/doctor) ──────────────────────────────────────────────────
function DoctorPage() {
  const navigate = useNavigate();
  return (
    <PageWrap title="Doctor Portal" icon={<Icons.stethoscope/>} subtitle="Clinical dashboard — Dr. Roberts">
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <button
          className="btn-primary"
          style={{ fontSize:12, padding:"8px 18px" }}
          onClick={()=>navigate("/rooms")}
        >
          Room assignment
        </button>
        <button
          className="btn-ghost"
          style={{ fontSize:12, padding:"8px 18px" }}
          onClick={()=>navigate("/schedule")}
        >
          Scheduling
        </button>
        <button
          className="btn-ghost"
          style={{ fontSize:12, padding:"8px 18px" }}
          onClick={()=>{
            const el = document.getElementById("doctor-queue");
            if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
          }}
        >
          Patient information (severity)
        </button>
        <button
          className="btn-ghost"
          style={{ fontSize:12, padding:"8px 18px" }}
          onClick={()=>{
            const el = document.getElementById("doctor-info");
            if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
          }}
        >
          Doctor information
        </button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        <Stat label="Today's Patients" value="12" color={T.rose}/>
        <Stat label="Pending Reviews" value="4" color={T.amber}/>
        <Stat label="Avg Wait Time" value="18m" sub="−3m from yesterday" color={T.vital}/>
        <Stat label="Critical Alerts" value="1" color={T.roseDeep}/>
      </div>
      <div style={{ marginBottom:18, padding:"14px 18px", borderRadius:14, background:`linear-gradient(135deg,${T.roseDeep}10,${T.roseTint})`, border:`1.5px solid ${T.rose}45`, display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:38, height:38, borderRadius:11, background:T.rose, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, animation:"breathe 2s ease-in-out infinite", flexShrink:0 }}><Icons.heartbeat/></div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, color:T.roseDeep }}>Critical Alert — Thomas Leclerc</div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkMid, marginTop:2 }}>Presage AI flags possible appendicitis. Severity Level 4. Expedite consultation.</div>
        </div>
        <button className="btn-primary" style={{ fontSize:12, padding:"8px 18px", flexShrink:0 }}>View Patient →</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16 }}>
        <div id="doctor-queue">
        <Card>
          <SHead>Today's Queue</SHead>
          {[{name:"Jordan Mitchell",time:"09:00",reason:"Follow-up — cardiac",sev:2},{name:"Priya Nair",time:"09:30",reason:"Annual physical",sev:1},{name:"Thomas Leclerc",time:"10:00",reason:"Acute abdominal pain",sev:4},{name:"Ana Reyes",time:"10:30",reason:"Prescription renewal",sev:1},{name:"Mohammed Al-Amin",time:"11:00",reason:"Hypertension follow-up",sev:3}].map((p,i)=>{
            const sc=p.sev>=4?T.roseDeep:p.sev>=3?T.amber:T.vital;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<4?`1px solid ${T.border}`:"none", cursor:"pointer", borderRadius:8, transition:"all .15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background=T.roseTint; e.currentTarget.style.padding="10px 8px"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.padding="10px 0"; }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:`${sc}15`, border:`2px solid ${sc}35`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:13, color:sc, flexShrink:0 }}>{p.name.charAt(0)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:13, color:T.ink }}>{p.name}</div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.inkFaint, marginTop:1 }}>{p.reason}</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.inkFaint }}>{p.time}</span>
                  <div style={{ padding:"2px 7px", borderRadius:5, background:`${sc}15`, fontFamily:"'DM Mono',monospace", fontSize:7, color:sc, letterSpacing:"0.1em" }}>SEV {p.sev}</div>
                </div>
              </div>
            );
          })}
        </Card>
        </div>
        <div id="doctor-info" style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Card>
            <SHead>Severity Guide</SHead>
            {[[1,T.vital,"Routine / Preventive"],[2,"#8BBF5A","Mild Symptoms"],[3,T.amber,"Moderate — Monitor"],[4,T.rose,"Urgent — Expedite"],[5,T.roseDeep,"Critical — Emergency"]].map(([n,c,l])=>(
              <div key={n} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <div style={{ width:26, height:26, borderRadius:7, background:`${c}18`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:12, color:c }}>{n}</div>
                <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkMid }}>{l}</span>
              </div>
            ))}
          </Card>
          <Card accent={T.vital}>
            <SHead>Dept. Capacity</SHead>
            {[["Emergency",85],["General",62],["Cardiology",44],["Radiology",71]].map(([dept,pct])=>(
              <div key={dept} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.inkMid }}>{dept}</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:pct>70?T.rose:T.vital }}>{pct}%</span>
                </div>
                <div style={{ height:4, borderRadius:4, background:T.bgDeep, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, borderRadius:4, background:pct>70?`linear-gradient(90deg,${T.amber},${T.rose})`:`linear-gradient(90deg,${T.vital},#4A9A7A)`, transition:"width .6s ease" }}/>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </PageWrap>
  );
}

// ─── HACKER PORTAL (/hacker) ─────────────────────────────────────────────────
function HackerPage() {
  return (
    <PageWrap title="You are in the Hacker Portal" icon={<Icons.shield/>} subtitle="System access — Security level Alpha">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        <Stat label="Active Sessions" value="3" color={T.rose}/>
        <Stat label="System Health" value="99.8%" color={T.vital}/>
        <Stat label="Threat Level" value="Low" color={T.vital}/>
        <Stat label="Last Sync" value="2m ago" color={T.amber}/>
      </div>
      <div style={{ marginBottom:18, padding:"14px 18px", borderRadius:14, background:`linear-gradient(135deg,${T.vital}10,rgba(91,170,138,0.08))`, border:`1.5px solid ${T.vital}45`, display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:38, height:38, borderRadius:11, background:T.vital, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, animation:"breathe 2s ease-in-out infinite", flexShrink:0 }}><Icons.shield/></div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, color:T.vital }}>System Status: All Systems Nominal</div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkMid, marginTop:2 }}>Welcome to the Hacker Portal. You have full system access.</div>
        </div>
        <button className="btn-primary" style={{ fontSize:12, padding:"8px 18px", flexShrink:0 }}>System Logs →</button>
      </div>
      <Card>
        <SHead>Hacker Portal</SHead>
        <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:T.inkMid, lineHeight:1.6 }}>
          Welcome to the exclusive Hacker Portal. This space is dedicated to security research, system analysis, and advanced infrastructure monitoring. You have privileged access to system diagnostics and network analytics.
        </p>
      </Card>
    </PageWrap>
  );
}

// ─── SCHEDULE (/schedule) ─────────────────────────────────────────────────────
function SchedulePage() {
  const [sel, setSel] = useState(12);
  const slots=["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30"];
  const taken=["09:00","10:00","14:30"];
  return (
    <PageWrap title="Schedule" icon={<Icons.calendar/>} subtitle="Appointments & availability">
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:18 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:16, color:T.ink }}>March 2026</div>
              <div style={{ display:"flex", gap:5 }}>
                <button className="btn-ghost" style={{ padding:"5px 11px", fontSize:12 }}>‹</button>
                <button className="btn-ghost" style={{ padding:"5px 11px", fontSize:12 }}>›</button>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:6 }}>
              {["S","M","T","W","T","F","S"].map((d,i)=>(
                <div key={i} style={{ textAlign:"center", fontFamily:"'DM Mono',monospace", fontSize:9, color:T.inkFaint, letterSpacing:"0.1em", paddingBottom:6 }}>{d}</div>
              ))}
              {Array.from({length:35},(_,i)=>{ const n=i-6; const day=n>0&&n<=31?n:null; const isSel=day===sel; const hasAppt=[3,12,18,24].includes(day);
                return <div key={i} onClick={()=>day&&setSel(day)} style={{ padding:"7px 0", textAlign:"center", borderRadius:8, cursor:day?"pointer":"default", background:isSel?`linear-gradient(135deg,${T.rose},${T.roseDeep})`:"transparent", color:isSel?T.white:day?T.ink:T.border, fontFamily:"'Outfit',sans-serif", fontWeight:isSel?700:400, fontSize:13, transition:"all .15s", position:"relative" }}>
                  {day}{hasAppt&&!isSel&&<div style={{ position:"absolute", bottom:3, left:"50%", transform:"translateX(-50%)", width:4, height:4, borderRadius:"50%", background:T.rose }}/>}
                </div>;
              })}
            </div>
          </Card>
          <Card>
            <SHead>Available Slots — Mar {sel}</SHead>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:7 }}>
              {slots.map(s=>{ const busy=taken.includes(s); return (
                <button key={s} disabled={busy} style={{ padding:"9px 0", borderRadius:9, cursor:busy?"not-allowed":"pointer", border:`1.5px solid ${busy?T.border:T.rose}`, background:busy?T.bgDeep:T.roseTint, fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:"0.05em", color:busy?T.inkFaint:T.rose, opacity:busy?.4:1, transition:"all .15s" }}
                  onMouseEnter={e=>{ if(!busy){ e.currentTarget.style.background=T.rose; e.currentTarget.style.color=T.white; } }}
                  onMouseLeave={e=>{ if(!busy){ e.currentTarget.style.background=T.roseTint; e.currentTarget.style.color=T.rose; } }}
                >{s}</button>
              ); })}
            </div>
          </Card>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Card accent={T.rose}>
            <SHead>Upcoming</SHead>
            {[["Mar 12","09:30","Dr. Roberts","Cardiology",T.rose],["Mar 18","14:00","Dr. Patel","Lab Work",T.vital]].map(([date,time,dr,dept,c],i)=>(
              <div key={i} style={{ padding:"11px 13px", marginBottom:8, borderRadius:9, background:`${c}08`, border:`1px solid ${c}28` }}>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, color:c }}>{date} · {time}</div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkMid, marginTop:1 }}>{dr} — {dept}</div>
              </div>
            ))}
          </Card>
          <Card>
            <SHead>Current Wait Times</SHead>
            {[["Emergency","4 min",T.vital],["General Practice","18 min",T.rose],["Specialist","32 min",T.amber],["Lab / Diagnostics","11 min",T.vital]].map(([k,v,c])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:T.ink }}>{k}</span>
                <div style={{ padding:"3px 9px", borderRadius:6, background:`${c}14`, fontFamily:"'DM Mono',monospace", fontSize:10, color:c, letterSpacing:"0.05em" }}>{v}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </PageWrap>
  );
}

// ─── HOSPITAL (/hospital) ─────────────────────────────────────────────────────
function HospitalPage() {
  const [hospitals, setHospitals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [distances, setDistances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  const hospitalColors = [T.vital, T.rose, T.amber, T.vital, T.vital, T.rose, T.amber, T.vital, T.amber, T.rose, T.vital, T.amber, T.rose, T.vital, T.amber, T.rose, T.vital, T.amber, T.rose, T.vital, T.amber, T.rose, T.vital, T.amber];

  // Approximate coordinates for Ontario hospitals (for client-side distance calculation)
  const hospitalCoords = {
    "200 Fletcher Crescent Alliston ON L9R 1W7": { lat: 44.0177, lng: -79.6404 },
    "201 Georgian Drive Barrie ON L4M 6M2": { lat: 44.3899, lng: -79.7561 },
    "2100 Bovaird Drive East Brampton ON L6R 3J7": { lat: 43.7315, lng: -79.7624 },
    "101 Humber College Boulevard Etobicoke ON M9V 1R8": { lat: 43.7315, lng: -79.5394 },
    "20 Lynch Street Brampton ON L6W 2Z8": { lat: 43.7117, lng: -79.7528 },
    "200 Church Street Toronto ON M9N 1N8": { lat: 43.6850, lng: -79.5150 },
    "459 Hume Street Collingwood ON L9Y 1W9": { lat: 44.4553, lng: -80.2331 },
    "100 Frank Miller Drive Huntsville ON P1H 1H7": { lat: 45.3342, lng: -79.2136 },
    "75 Ann Street Bracebridge ON P1L 2E4": { lat: 45.1317, lng: -79.3161 },
    "381 Church Street Markham ON L3P 7P3": { lat: 43.8500, lng: -79.2469 },
    "4 Campbell Drive Uxbridge ON L9P 1S4": { lat: 43.8561, lng: -79.1292 },
    "1112 St. Andrew's Drive Midland ON L4R 4P4": { lat: 44.7653, lng: -79.2903 },
    "2200 Eglinton Avenue West Mississauga ON L5M 2N1": { lat: 43.5633, lng: -79.5950 },
    "100 Queensway West Mississauga ON L5B 1B8": { lat: 43.5850, lng: -79.6444 },
    "150 Sherway Drive Toronto ON M9C 1A5": { lat: 43.5267, lng: -79.5539 },
    "2180 Speakman Drive Mississauga ON L5K 0B1": { lat: 43.5983, lng: -79.6428 },
    "82 Buttonwood Avenue Toronto ON M6M 2J5": { lat: 43.7136, lng: -79.4619 },
    "596 Davis Drive Newmarket ON L3Y 2P9": { lat: 44.0497, lng: -79.4606 },
    "3001 Hospital Drive Oakville ON L6M 0L8": { lat: 43.4671, lng: -79.2742 },
    "725 Bronte Street South Milton ON L9T 9K1": { lat: 43.5236, lng: -79.8728 }
  };

  // Postal code to approximate coordinates mapping
  const postalCodeCoords = {
    "L9R": { lat: 44.0177, lng: -79.6404 },
    "L4M": { lat: 44.3899, lng: -79.7561 },
    "L6R": { lat: 43.7315, lng: -79.7624 },
    "M9V": { lat: 43.7315, lng: -79.5394 },
    "L6W": { lat: 43.7117, lng: -79.7528 },
    "M9N": { lat: 43.6850, lng: -79.5150 },
    "L9Y": { lat: 44.4553, lng: -80.2331 },
    "P1H": { lat: 45.3342, lng: -79.2136 },
    "P1L": { lat: 45.1317, lng: -79.3161 },
    "L3P": { lat: 43.8500, lng: -79.2469 },
    "L9P": { lat: 43.8561, lng: -79.1292 },
    "L4R": { lat: 44.7653, lng: -79.2903 },
    "L5M": { lat: 43.5633, lng: -79.5950 },
    "L5B": { lat: 43.5850, lng: -79.6444 },
    "M9C": { lat: 43.5267, lng: -79.5539 },
    "L5K": { lat: 43.5983, lng: -79.6428 },
    "M6M": { lat: 43.7136, lng: -79.4619 },
    "L3Y": { lat: 44.0497, lng: -79.4606 },
    "L6M": { lat: 43.4671, lng: -79.2742 },
    "L9T": { lat: 43.5236, lng: -79.8728 },
    "L7G": { lat: 43.6532, lng: -79.9167 },
    "L9W": { lat: 43.9192, lng: -80.0967 },
    "L3V": { lat: 44.6087, lng: -79.4207 },
    "L9M": { lat: 44.7667, lng: -79.9333 },
    "L4C": { lat: 43.8828, lng: -79.4403 }
  };

  const getCoordinatesForAddress = (address) => {
    const trimmedAddress = address.trim();
    
    // Try exact match first
    if (hospitalCoords[trimmedAddress]) {
      return hospitalCoords[trimmedAddress];
    }

    // Try matching by substring
    for (const [key, coords] of Object.entries(hospitalCoords)) {
      if (trimmedAddress.includes(key) || key.includes(trimmedAddress)) {
        return coords;
      }
    }

    // Try extracting postal code (format: A1A 1A1 or A1A1A1)
    const postalMatch = address.match(/([A-Z]\d[A-Z])\s?(\d[A-Z]\d)/i);
    if (postalMatch) {
      const postalPrefix = postalMatch[1];
      if (postalCodeCoords[postalPrefix]) {
        return postalCodeCoords[postalPrefix];
      }
    }

    return null;
  };

  // Haversine formula to calculate distance between two coordinates
  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate drive time estimate (rough: ~60km/h average)
  const estimateDriveTime = (distanceKm) => {
    const hours = distanceKm / 60;
    const minutes = Math.round(hours * 60);
    if (minutes < 60) return `${minutes} min`;
    const hr = Math.floor(hours);
    const min = minutes % 60;
    return `${hr}h ${min}m`;
  };

  // Parse duration string to total minutes
  const parseDurationToMinutes = (duration) => {
    if (!duration || duration === 'N/A') return 0;
    const hourMatch = duration.match(/(\d+)h/);
    const minMatch = duration.match(/(\d+)m/);
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const mins = minMatch ? parseInt(minMatch[1]) : 0;
    return hours * 60 + mins;
  };

  // Get color based on drive time
  const getDriveTimeColor = (duration) => {
    const minutes = parseDurationToMinutes(duration);
    if (minutes < 60) return T.vital; // Green for <1 hour
    if (minutes <= 120) return T.amber; // Yellow for 1-2 hours
    return T.rose; // Red for 2+ hours
  };

  const calculateDistances = (hospitalsToUse) => {
    try {
      const dists = hospitalsToUse.map((h, index) => {
        const coords = getCoordinatesForAddress(h.address);
        if (coords) {
          const distance = calculateHaversineDistance(
            userLocation.lat,
            userLocation.lng,
            coords.lat,
            coords.lng
          );
          return {
            ...h,
            distance: distance,
            duration: estimateDriveTime(distance),
            col: hospitalColors[index % hospitalColors.length],
            coords: coords,
          };
        }
        return {
          ...h,
          distance: null,
          duration: 'N/A',
          col: hospitalColors[index % hospitalColors.length],
        };
      });
      setDistances(dists);
      setError(null);
    } catch (error) {
      console.error('Error calculating distances:', error);
      setError('Failed to calculate distances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const response = await fetch('/hospitals.csv');
        const text = await response.text();
        const lines = text.trim().split('\n');
        const parsedHospitals = lines.map((line, i) => {
          const [name, address] = line.split(',');
          return { name: name.trim(), address: address.trim(), col: hospitalColors[i % hospitalColors.length] };
        });
        setHospitals(parsedHospitals);
      } catch (error) {
        console.error('Error loading hospitals:', error);
        setError('Could not load hospital data');
        setLoading(false);
      }
    };

    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            // Fallback to Toronto
            setUserLocation({ lat: 43.6532, lng: -79.3832 });
          }
        );
      } else {
        setUserLocation({ lat: 43.6532, lng: -79.3832 });
      }
    };

    loadHospitals();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (hospitals.length > 0 && userLocation) {
      calculateDistances(hospitals);
    }
  }, [hospitals, userLocation]);

  const validHospitals = distances.filter(h => h.distance !== null);
  const sortedHospitals = [...validHospitals].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.distance - b.distance;
    } else {
      return b.distance - a.distance;
    }
  });

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const openDirections = (hospital) => {
    if (!userLocation) {
      alert('Location not available');
      return;
    }
    const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${hospital.coords.lat},${hospital.coords.lng}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <PageWrap title="Find Hospital" icon={<Icons.mapPin/>} subtitle="Nearest facilities & live routing">
        <div style={{ textAlign: 'center', padding: '50px', fontFamily:"'Outfit',sans-serif", color: T.inkFaint }}>Loading hospitals...</div>
      </PageWrap>
    );
  }

  if (error) {
    return (
      <PageWrap title="Find Hospital" icon={<Icons.mapPin/>} subtitle="Nearest facilities & live routing">
        <div style={{ textAlign: 'center', padding: '50px', fontFamily:"'Outfit',sans-serif", color: T.rose }}>Error: {error}</div>
      </PageWrap>
    );
  }

  return (
    <PageWrap title="Find Hospital" icon={<Icons.mapPin/>} subtitle="Nearest facilities & live routing">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr", gap:18 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SHead>Nearby Hospitals</SHead>
            <button className="btn-ghost" onClick={toggleSort} style={{ fontSize: 12, padding: "5px 12px" }}>
              Sort {sortOrder === 'asc' ? '↑ Closest First' : '↓ Farthest First'}
            </button>
          </div>
          {sortedHospitals.length > 0 ? sortedHospitals.map((h,i)=>(
            <Card key={i} onClick={()=>{}} accent={h.col} style={{ padding:"16px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:9 }}>
                <div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, color:T.ink }}>{h.name}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.08em", marginTop:2 }}>{h.distance ? `${h.distance.toFixed(1)} km away` : 'Distance unavailable'}</div>
                </div>
                <div style={{ textAlign:"center", padding:"7px 12px", borderRadius:9, background:`${getDriveTimeColor(h.duration)}14`, border:`1px solid ${getDriveTimeColor(h.duration)}35` }}>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:18, color:getDriveTimeColor(h.duration) }}>{h.duration || 'N/A'}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:getDriveTimeColor(h.duration), letterSpacing:"0.12em", textTransform:"uppercase" }}>Drive Time</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:5, height:5, borderRadius:"50%", background:h.col }}/><span style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.inkMid }}>Address: {h.address}</span></div>
                <button className="btn-ghost" onClick={() => openDirections(h)} style={{ fontSize:10, padding:"5px 12px" }}>Directions →</button>
              </div>
            </Card>
          )) : (
            <div style={{ textAlign: 'center', padding: '20px', fontFamily:"'Outfit',sans-serif", color: T.inkFaint }}>No hospitals found</div>
          )}
        </div>
        <div style={{ minHeight:400, borderRadius:20, overflow:"hidden", background:`linear-gradient(135deg,${T.bgDeep} 0%,#E8D8CC 100%)`, border:`1px solid ${T.border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", height:400 }}>
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:.12 }} viewBox="0 0 400 400">
            {Array.from({length:9},(_,i)=>(<g key={i}><line x1={i*50} y1="0" x2={i*50} y2="400" stroke={T.rose} strokeWidth=".8"/><line x1="0" y1={i*50} x2="400" y2={i*50} stroke={T.rose} strokeWidth=".8"/></g>))}
            <path d="M 80 200 L 200 200 L 200 120 L 300 120" fill="none" stroke={T.rose} strokeWidth="3" strokeLinecap="round"/>
            <path d="M 40 280 L 160 280 L 200 200" fill="none" stroke={T.amber} strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="200" cy="200" r="10" fill={T.rose} opacity=".6"/>
            <circle cx="300" cy="120" r="8" fill={T.vital} opacity=".7"/>
            <circle cx="40" cy="280" r="8" fill={T.amber} opacity=".7"/>
          </svg>
          <div style={{ textAlign:"center", zIndex:1 }}>
            <div style={{ width:60, height:60, borderRadius:18, background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, margin:"0 auto 14px", animation:"float 3s ease-in-out infinite" }}><Icons.mapPin/></div>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:18, color:T.ink }}>Interactive Hospital Map</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:13, color:T.inkFaint, marginTop:5 }}>Three.js 3D visualization with live routing</div>
            <button className="btn-primary" style={{ marginTop:18, fontSize:13 }}>Enable Location →</button>
          </div>
        </div>
      </div>
    </PageWrap>
  );
}

// ─── ROOMS (/rooms) ───────────────────────────────────────────────────────────
function RoomsPage() {
  const rooms=Array.from({length:30},(_,i)=>({ id:`${Math.floor(i/6)+1}0${(i%6)+1}`, floor:Math.floor(i/6)+1, status:["occupied","occupied","available","maintenance","occupied","available"][i%6] }));
  const sc=s=>({occupied:T.rose,available:T.vital,maintenance:T.amber}[s]||T.inkFaint);
  const sl=s=>({occupied:"In Use",available:"Free",maintenance:"Maint."}[s]||s);
  return (
    <PageWrap title="Room Map" icon={<Icons.grid/>} subtitle="Live floor plan · Real-time bed status">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20, maxWidth:480 }}>
        {[["Occupied",T.rose],["Available",T.vital],["Maintenance",T.amber]].map(([s,c])=>(
          <Card key={s} accent={c} style={{ textAlign:"center", padding:"14px 10px" }}>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:28, color:c }}>{rooms.filter(r=>r.status===s.toLowerCase()).length}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:"0.12em", color:c, textTransform:"uppercase", marginTop:3 }}>{s}</div>
          </Card>
        ))}
      </div>
      {[1,2,3,4,5].map(floor=>(
        <Card key={floor} style={{ marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
            <div style={{ width:26, height:26, borderRadius:7, background:T.roseTint, border:`1px solid ${T.borderStrong}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:12, color:T.rose }}>{floor}</div>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:13, color:T.ink }}>Floor {floor}</div>
            <div style={{ marginLeft:"auto", fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.1em", textTransform:"uppercase" }}>{rooms.filter(r=>r.floor===floor&&r.status==="available").length} free of {rooms.filter(r=>r.floor===floor).length}</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:7 }}>
            {rooms.filter(r=>r.floor===floor).map(r=>(
              <div key={r.id} style={{ padding:"11px 5px", borderRadius:9, textAlign:"center", cursor:"pointer", background:`${sc(r.status)}10`, border:`1.5px solid ${sc(r.status)}28`, transition:"all .15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background=`${sc(r.status)}20`; e.currentTarget.style.borderColor=sc(r.status); e.currentTarget.style.transform="scale(1.05)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=`${sc(r.status)}10`; e.currentTarget.style.borderColor=`${sc(r.status)}28`; e.currentTarget.style.transform="scale(1)"; }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:T.ink, letterSpacing:"0.04em", marginBottom:3 }}>{r.id}</div>
                <div style={{ width:6, height:6, borderRadius:"50%", background:sc(r.status), margin:"0 auto 3px" }}/>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:sc(r.status), letterSpacing:"0.07em", textTransform:"uppercase" }}>{sl(r.status)}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </PageWrap>
  );
}

// ─── LANDING PAGE (/) ─────────────────────────────────────────────────────────
function LandingPage() {
  const { isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const FEATURES = [
    [<Icons.brain/>,       "#8B6FBF", "Presage AI Triage",   "Symptom analysis with confidence scoring — powered by Claude."],
    [<Icons.mapPin/>,      T.vital,   "Hospital Routing",    "Nearest facility with live wait times and bed availability."],
    [<Icons.calendar/>,    T.rose,    "Smart Scheduling",    "Book appointments, view slots, and manage your care calendar."],
    [<Icons.stethoscope/>, T.roseMid, "Doctor Portal",       "Clinical dashboards, patient queues, and AI-flagged alerts."],
    [<Icons.shield/>,      T.amber,   "Auth0 Security",      "Enterprise-grade authentication. HIPAA-aligned. SOC 2 Type II."],
    [<Icons.heartbeat/>,   T.vital,   "Live Vitals",         "Real-time health monitoring integrated across all portals."],
  ];

  return (
    <div ref={scrollRef} style={{ position:"fixed", inset:0, overflowY:"auto", background:T.bg }}>

      {/* ── Sticky Nav ── */}
      <div style={{ position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 48px", height:66, background: scrolled ? "rgba(248,240,232,.97)" : "rgba(248,240,232,.6)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${scrolled ? T.border : "transparent"}`, transition:"all .3s ease" }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, animation:"breathe 3s ease-in-out infinite" }}>
            <Icons.cross/>
          </div>
          <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:20, color:T.ink, letterSpacing:"-0.03em" }}>Sanctii</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          {["Features","Hospitals","Presage AI"].map(l=>(
            <span key={l} style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:T.inkFaint, cursor:"pointer", transition:"color .2s" }}
              onMouseEnter={e=>{ e.target.style.color=T.rose; }} onMouseLeave={e=>{ e.target.style.color=T.inkFaint; }}>{l}</span>
          ))}
          <div style={{ width:1, height:20, background:T.border }}/>
          <button className="btn-ghost" onClick={()=>navigate("/login")} style={{ fontSize:12, padding:"8px 18px" }}>Sign In</button>
          <button className="btn-primary" onClick={()=>navigate("/login")} style={{ fontSize:12, padding:"9px 22px" }}>Get Started →</button>
        </div>
      </div>

      {/* ── HERO (full viewport, split) ── */}
      <section style={{ height:"calc(100vh - 66px)", display:"flex", position:"relative", overflow:"hidden" }}>

        {/* Background orbs behind hero */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0 }}>
          <div style={{ position:"absolute", top:"-10%", right:"35%", width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle,${T.rosePale}30 0%,transparent 70%)` }}/>
          <div style={{ position:"absolute", bottom:"-15%", left:"5%", width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle,rgba(91,170,138,.1) 0%,transparent 65%)` }}/>
        </div>

        {/* ── LEFT: Text & CTAs ── */}
        <div style={{ flex:"0 0 48%", display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 56px 0 60px", position:"relative", zIndex:2 }}>

          {/* Badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:100, background:`${T.rose}12`, border:`1px solid ${T.rose}35`, marginBottom:26, width:"fit-content", animation:"fadeUp .4s ease" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:T.vital, animation:"pulse 1.5s ease infinite" }}/>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.rose, letterSpacing:"0.16em", textTransform:"uppercase" }}>Powered by Claude AI · Presage Engine</span>
          </div>

          {/* Headline */}
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:"clamp(36px,4.2vw,62px)", color:T.ink, letterSpacing:"-0.04em", lineHeight:1.06, marginBottom:16, animation:"fadeUp .5s ease" }}>
            Healthcare,<br/>intelligently<br/>
            <span style={{ background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>before you arrive.</span>
          </div>

          {/* Subhead */}
          <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:"clamp(14px,1.4vw,18px)", color:T.inkFaint, lineHeight:1.75, marginBottom:36, maxWidth:420, animation:"fadeUp .6s ease" }}>
            Sanctii connects patients, doctors, and hospitals through AI-powered triage, real-time routing, and seamless scheduling.
          </div>

          {/* CTAs */}
          <div style={{ display:"flex", gap:12, marginBottom:44, animation:"fadeUp .7s ease" }}>
            <button className="btn-primary" onClick={()=>navigate("/login")} style={{ fontSize:14, padding:"13px 32px" }}>
              Start Now →
            </button>
            <button className="btn-ghost" onClick={()=>navigate("/login")} style={{ fontSize:14, padding:"12px 24px" }}>
              Sign In
            </button>
          </div>

          {/* Live vitals */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", animation:"fadeUp .8s ease" }}>
            {[["♥","72 bpm",T.vital],["⚡","98% SpO₂",T.rose],["🌡","36.6°C",T.amber],["🛏","12 beds",T.vital]].map(([ic,v,c])=>(
              <div key={v} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:100, background:T.surfaceHard, border:`1px solid ${T.border}`, boxShadow:"0 1px 8px rgba(160,80,80,.06)" }}>
                <span style={{ fontSize:11 }}>{ic}</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:c, letterSpacing:"0.04em" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Scroll hint */}
          <div style={{ position:"absolute", bottom:28, left:60, display:"flex", alignItems:"center", gap:8, opacity:.5 }}>
            <div style={{ width:1, height:28, background:T.border }}/>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:T.inkFaint, letterSpacing:"0.18em", textTransform:"uppercase" }}>Scroll to explore</span>
          </div>
        </div>

        {/* ── RIGHT: 3D Hologram ── */}
        <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
          {/* Dark gradient so hologram pops */}
          <div style={{ position:"absolute", inset:0, background:`linear-gradient(135deg,rgba(20,8,8,.82) 0%,rgba(10,22,18,.78) 100%)`, zIndex:1 }}/>

          {/* Subtle grid overlay */}
          <div style={{ position:"absolute", inset:0, zIndex:2, pointerEvents:"none", backgroundImage:`linear-gradient(${T.vital}08 1px,transparent 1px),linear-gradient(90deg,${T.vital}08 1px,transparent 1px)`, backgroundSize:"32px 32px" }}/>

          {/* Corner brackets */}
          {[["0","0","borderTop","borderLeft"],["0","auto","borderTop","borderRight"],["auto","0","borderBottom","borderLeft"],["auto","auto","borderBottom","borderRight"]].map(([t,r,b1,b2],i)=>(
            <div key={i} style={{ position:"absolute", top:t, right:r, bottom:i>1?0:"auto", left:i%2===0?0:"auto", width:28, height:28, [b1]:`1.5px solid ${T.vital}`, [b2]:`1.5px solid ${T.vital}`, opacity:.4, zIndex:3, margin:20 }}/>
          ))}

          {/* HUD overlay top-right */}
          <div style={{ position:"absolute", top:20, right:20, zIndex:4, display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ padding:"5px 10px", background:"rgba(0,0,0,.5)", borderRadius:6, border:`1px solid ${T.vital}30`, backdropFilter:"blur(8px)" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:T.vital, letterSpacing:"0.14em", textTransform:"uppercase" }}>◉ Hologram Active</span>
            </div>
            <div style={{ padding:"5px 10px", background:"rgba(0,0,0,.5)", borderRadius:6, border:`1px solid ${T.rose}30`, backdropFilter:"blur(8px)" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:T.rose, letterSpacing:"0.14em", textTransform:"uppercase" }}>Drag · Scroll · Interact</span>
            </div>
          </div>

          {/* HUD bottom-left */}
          <div style={{ position:"absolute", bottom:20, left:20, zIndex:4 }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:"rgba(91,170,138,.5)", letterSpacing:"0.12em", textTransform:"uppercase", lineHeight:2 }}>
              Sanctii General Hospital<br/>
              St. Michael's · Toronto, ON<br/>
              <span style={{ color:T.vital }}>12 beds available</span>
            </div>
          </div>

          {/* Three.js canvas */}
          <div style={{ position:"absolute", inset:0, zIndex:3 }}>
            <HospitalHologram/>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section style={{ padding:"80px 60px 60px", position:"relative" }}>
        <BgOrbs/>
        <EcgStrip bottom={0} opacity={.05}/>

        <div style={{ textAlign:"center", marginBottom:48, position:"relative", zIndex:1 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:"0.18em", textTransform:"uppercase", color:T.inkFaint, marginBottom:12 }}>Platform Capabilities</div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:"clamp(28px,3vw,42px)", color:T.ink, letterSpacing:"-0.03em" }}>
            Everything you need,<br/>
            <span style={{ background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>in one intelligent platform.</span>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16, maxWidth:1100, margin:"0 auto", position:"relative", zIndex:1 }}>
          {FEATURES.map(([ic,c,title,desc],i)=>(
            <div key={i} className="glass-hard"
              style={{ padding:"26px 22px", textAlign:"left", animation:`fadeUp .5s ease ${.05+i*.07}s both`, opacity:0, cursor:"default", transition:"all .2s ease" }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow=`0 12px 32px ${c}22`; e.currentTarget.style.borderColor=`${c}40`; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 12px rgba(160,80,80,.05)"; e.currentTarget.style.borderColor=T.border; }}
            >
              <div style={{ width:42, height:42, borderRadius:12, background:`${c}18`, display:"flex", alignItems:"center", justifyContent:"center", color:c, marginBottom:14, border:`1px solid ${c}30` }}>{ic}</div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, color:T.ink, marginBottom:6 }}>{title}</div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkFaint, lineHeight:1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section style={{ padding:"40px 60px", borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, background:T.surfaceHard, position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"center", gap:0, maxWidth:900, margin:"0 auto", flexWrap:"wrap" }}>
          {[["98%","Triage Accuracy"],["< 2s","AI Response"],["4 Cities","Active Hospitals"],["SOC 2","Type II Certified"]].map(([val,lbl],i)=>(
            <div key={i} style={{ flex:"1 1 180px", textAlign:"center", padding:"16px 24px", borderRight:i<3?`1px solid ${T.border}`:"none" }}>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:32, color:T.rose, letterSpacing:"-0.03em" }}>{val}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.14em", textTransform:"uppercase", marginTop:4 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section style={{ padding:"72px 60px", textAlign:"center", position:"relative" }}>
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at center,${T.rosePale}20 0%,transparent 70%)`, pointerEvents:"none" }}/>
        <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:"clamp(26px,3vw,40px)", color:T.ink, letterSpacing:"-0.03em", marginBottom:10, position:"relative", zIndex:1 }}>
          Ready to transform your<br/>healthcare experience?
        </div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:16, color:T.inkFaint, marginBottom:32, position:"relative", zIndex:1 }}>
          Join Sanctii today — no setup required.
        </div>
        <button className="btn-primary" onClick={()=>navigate("/login")} style={{ fontSize:15, padding:"14px 40px", position:"relative", zIndex:1 }}>
          Create Your Account →
        </button>
      </section>

      {/* ── Footer ── */}
      <div style={{ borderTop:`1px solid ${T.border}`, padding:"24px 60px", display:"flex", alignItems:"center", justifyContent:"space-between", background:T.surfaceHard }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white }}><Icons.cross/></div>
          <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, color:T.inkMid }}>Sanctii</span>
        </div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:T.inkFaint, letterSpacing:"0.12em", textTransform:"uppercase", textAlign:"center" }}>
          Secured by Auth0 · HIPAA-aligned · SOC 2 Type II · © 2026 Sanctii Health Technologies
        </div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:T.inkFaint, letterSpacing:"0.1em" }}>v1.0.0</div>
      </div>

    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const { isLoading } = useAuth0();

  if (isLoading) return (
    <>
      <GlobalStyle/>
      <div style={{ position:"fixed", inset:0, background:T.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:120, textAlign:"center" }}>
          <div style={{ width:42, height:42, borderRadius:12, background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, margin:"0 auto 16px", animation:"breathe 2s ease-in-out infinite" }}>
            <Icons.cross/>
          </div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, color:T.ink, letterSpacing:"-0.01em" }}>Sanctii</div>
          <div style={{ width:30, height:1, background:T.border, margin:"8px auto" }}/>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.12em", textTransform:"uppercase" }}>Securing Context</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <GlobalStyle/>
      {/* Grain texture overlay */}
      <div style={{ position:"fixed", top:"-50%", left:"-50%", width:"200%", height:"200%", backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, pointerEvents:"none", zIndex:9999, opacity:.22 }}/>

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/login" element={<LoginPage/>}/>

        {/* Protected routes — require Auth0 authentication */}
        <Route path="/role" element={
          <ProtectedRoute><RoleSelectionPage/></ProtectedRoute>
        }/>
        <Route path="/app" element={
          <ProtectedRoute><MazePage/></ProtectedRoute>
        }/>
        <Route path="/patient" element={
          <ProtectedRoute><PatientPage/></ProtectedRoute>
        }/>
        <Route path="/doctor" element={
          <ProtectedRoute><DoctorPage/></ProtectedRoute>
        }/>
        <Route path="/hacker" element={
          <ProtectedRoute><HackerPage/></ProtectedRoute>
        }/>
        <Route path="/presage" element={
          <ProtectedRoute><PresagePage PageWrap={PageWrap} /></ProtectedRoute>
        }/>
        <Route path="/patient/scanner" element={
          <ProtectedRoute><ScannerPage PageWrap={PageWrap} /></ProtectedRoute>
        }/>
        <Route path="/schedule" element={
          <ProtectedRoute><SchedulePage/></ProtectedRoute>
        }/>
        <Route path="/hospital" element={
          <ProtectedRoute><HospitalPage/></ProtectedRoute>
        }/>
        <Route path="/rooms" element={
          <ProtectedRoute><RoomsPage/></ProtectedRoute>
        }/>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </>
  );
}

