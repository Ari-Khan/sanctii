import { useState, useEffect, useRef } from "react";

// backend API base (hard‑coded as per instructions)
const API_BASE = "http://localhost:5176";
import { Routes, Route, useNavigate, Navigate, useSearchParams, useLocation } from "react-router-dom";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useAuth0 } from "@auth0/auth0-react";
import ProtectedRoute from "./auth/ProtectedRoute";
import { getUserRoles, ROLE } from "./auth/roles";
import { Icons } from "./theme";
import { BgOrbs, EcgStrip, Card } from "./components/SharedUI";
import HospitalHologram from "./components/Hologram";
import HospitalMap3D from "./components/HospitalMap3D";
import { getPersistedRole, setPersistedRole } from "./auth/persistedRole";
import PresagePage from "./pages/Presage";
import ScannerPage from "./pages/ScannerPage";
import PatientFeedbackPage from "./pages/PatientFeedbackPage";

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
  blue:         "#6B9FD4",
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

export function SHead({ children }) {
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
  patient:   { x:25, y:25, label:"Patient Portal", icon:"user", path:"/patient", col:T.rose },
  doctor:    { x:75, y:25, label:"Doctor Portal", icon:"stethoscope", path:"/doctor", col:T.blue },
  schedule:  { x:25, y:75, label:"Scheduling", icon:"calendar", path:"/schedule", col:T.amber },
  presage:   { x:75, y:75, label:"Presage AI", icon:"brain", path:"/presage", col:T.amber },
  hospital:  { x:25, y:75, label:"Find Hospital", icon:"mapPin", path:"/hospital", col:T.vital },
  feedback:  { x:75, y:25, label:"Doctor Feedback", icon:"heart", path:"/patient/feedback", col:T.blue },
  rooms:     { x:75, y:75, label:"Room Map", icon:"grid", path:"/rooms", col:T.vital },
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
  { from:"center", to:"patient" },       // spoke top-left
  { from:"center", to:"feedback" },      // spoke top-right
  { from:"center", to:"hospital" },      // spoke bottom-left
  { from:"center", to:"presage" },       // spoke bottom-right
  { from:"patient", to:"feedback" },     // top edge
  { from:"feedback", to:"presage" },     // right edge
  { from:"presage", to:"hospital" },     // bottom edge
  { from:"hospital", to:"patient" },     // left edge
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
      return ["center","patient","hospital","presage","feedback"];
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
            <marker id="arr-edge" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <polygon points="0 0,5 2.5,0 5" fill="context-stroke"/>
            </marker>
          </defs>
          {DECOS.map((d,i)=><path key={i} d={d} fill="none" stroke={T.border} strokeWidth=".7" strokeLinecap="round" opacity=".8"/>)}
          {activeEdges.map((e,i)=>{ const f=NODES[e.from],t=NODES[e.to]; const col=NODES[e.to]?.col||T.rose; const isConnected=hov&&(e.from===hov||e.to===hov); let d=`M ${f.x} ${f.y}`; (e.wp||[]).forEach(w=>{ d+=` L ${w.x} ${w.y}`; }); d+=` L ${t.x} ${t.y}`; return <path key={i} d={d} fill="none" stroke={col} strokeWidth={isConnected?".9":".6"} strokeDasharray="1.5 2" opacity={isConnected?.85:.3} markerEnd="url(#arr-edge)"/>; })}
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
                  else if (key === "patient") navigate("/doctor?tab=patients"); // patient info by severity
                  else if (key === "doctor") navigate("/doctor?tab=floorplan");  // doctor information
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
                {activeRole === ROLE.PATIENT && key === "presage" && "Presage AI"}
                {activeRole === ROLE.PATIENT && key === "feedback" && "Doctor Feedback"}
                {activeRole === ROLE.DOCTOR && key === "rooms" && "Room assignment"}
                {activeRole === ROLE.DOCTOR && key === "schedule" && "Scheduling"}
                {activeRole === ROLE.DOCTOR && key === "patient" && "Patient info (severity)"}
                {activeRole === ROLE.DOCTOR && key === "doctor" && "Doctor information"}
                {!activeRole && node.label}
                {activeRole && !["patient","hospital","presage","feedback","rooms","schedule","doctor"].includes(key) && node.label}
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
export function PageWrap({ children, title, icon, subtitle, badge }) {
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
  const [healthcard, setHealthcard] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`http://localhost:3001/api/healthcard?email=${encodeURIComponent(user.email)}`)
      .then(r => { if (r.ok) return r.json(); throw new Error("none"); })
      .then(card => setHealthcard(card))
      .catch(() => setHealthcard(null));
  }, [user?.email]);

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
          className="btn-ghost"
          style={{ fontSize:12, padding:"8px 18px" }}
          onClick={()=>navigate("/patient/feedback")}
        >
          Doctor Feedback
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
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:2 }}>
                  {healthcard?.card_number || "No health card on file"}
                </div>
              </div>
            </div>
            {healthcard ? (
              <>
                {[
                  ["Full Name", healthcard.full_name],
                  ["Card Number", healthcard.card_number],
                  ["Date of Birth", healthcard.date_of_birth],
                  ["Gender", healthcard.gender],
                  ["Province", healthcard.province],
                  ["Expiry Date", healthcard.expiry_date],
                ].filter(([,v]) => v).map(([k,v])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkFaint }}>{k}</span>
                    <span style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:12, color:T.ink }}>{v}</span>
                  </div>
                ))}
                <button className="btn-ghost" onClick={()=>navigate("/patient/scanner")} style={{ marginTop:10, fontSize:11, padding:"7px 14px", width:"100%" }}>
                  Update Health Card
                </button>
              </>
            ) : (
              <div style={{ textAlign:"center", padding:"16px 0" }}>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:T.inkFaint, marginBottom:12 }}>No health card information on file</div>
                <button className="btn-primary" onClick={()=>navigate("/patient/scanner")} style={{ fontSize:12, padding:"9px 20px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <Icons.card/> Scan or Enter Health Card
                  </div>
                </button>
              </div>
            )}
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

// ─── NYGH FLOOR PLAN ──────────────────────────────────────────────────────────
// Coordinate space: x 0-100 (width), y 0-50 (depth). 4-unit gaps between rooms.
// Rooms sized proportionally to real hospital room footprints.
// cur = current patients; cap = maximum capacity. occ% = cur/cap*100.
// All sections are clinical treatment or physician areas — no lobby/admin.
//
// Column grid used across floors (x):
//   Col-A x:2–24 (w:22) | gap 4 | Col-B x:28–50 (w:22) | gap 4 |
//   Col-C x:54–70 (w:16) | gap 4 | Col-D x:74–88 (w:14) | gap 4 |
//   Col-E x:92–98 (w:6, spans full y for nursing / consulting)
// Row grid (y):  Row-T y:2–24 (h:22) | gap 4 | Row-B y:28–48 (h:20)
const NYGH_FLOORS = [
  // ── GROUND FLOOR ────────────────────────────────────────────────────────────
  // Layout: Emergency wing (left) | Trauma/Resus (centre-left) |
  //         Imaging suites (centre) | Lab + Pharmacy (right)
  { id:"g", label:"Ground", name:"Ground Floor — Emergency & Acute Diagnostics",
    depts:[
      // Emergency wing — Col A (x:2–24)
      { id:"ed-triage",   label:"ED Triage",          x:2,  y:2,  w:22, h:22, cur:14, cap:18 },
      { id:"ed-waiting",  label:"ED Waiting",          x:2,  y:28, w:22, h:20, cur:32, cap:50 },
      // Acute treatment — Col B (x:28–46, w:18 to share with trauma)
      { id:"ed-exam",     label:"ED Exam Bays A–E",    x:28, y:2,  w:18, h:22, cur:12, cap:14 },
      { id:"trauma-resus",label:"Trauma / Resus",      x:28, y:28, w:18, h:20, cur:3,  cap:4  },
      // Imaging — Col C1 (x:50–62, w:12): CT scanners stacked, MRI below
      { id:"ct-1",        label:"CT Scanner 1",        x:50, y:2,  w:12, h:10, cur:2,  cap:2  },
      { id:"ct-2",        label:"CT Scanner 2",        x:50, y:16, w:12, h:8,  cur:1,  cap:2  },
      { id:"mri-g",       label:"MRI Suite",           x:50, y:28, w:12, h:20, cur:1,  cap:1  },
      // Imaging — Col C2 (x:66–76, w:10)
      { id:"xray-g",      label:"X-Ray / Fluoroscopy", x:66, y:2,  w:10, h:22, cur:4,  cap:6  },
      { id:"ultrasound-g",label:"Ultrasound Suite",    x:66, y:28, w:10, h:20, cur:3,  cap:4  },
      // Clinical support — Col D+E (x:80–98, w:18)
      { id:"lab-g",       label:"Lab & Pathology",     x:80, y:2,  w:18, h:22, cur:10, cap:20 },
      { id:"pharmacy-g",  label:"Clinical Pharmacy",   x:80, y:28, w:18, h:20, cur:6,  cap:12 },
    ],
  },

  // ── FLOOR 1 ─────────────────────────────────────────────────────────────────
  // Layout: 8 Operating Rooms (paired columns) | Pre-Op & PACU | Day Sx | Endoscopy
  { id:"1", label:"Floor 1", name:"Floor 1 — Surgical Suite & Perioperative Care",
    depts:[
      // 4 OR pairs — each pair: top (h:22) + bottom (h:20), w:10, gap 4 between pairs
      { id:"or-1",     label:"OR 1 — General Sx",    x:2,  y:2,  w:10, h:22, cur:1, cap:1 },
      { id:"or-2",     label:"OR 2 — General Sx",    x:2,  y:28, w:10, h:20, cur:0, cap:1 },
      { id:"or-3",     label:"OR 3 — Orthopaedics",  x:16, y:2,  w:10, h:22, cur:1, cap:1 },
      { id:"or-4",     label:"OR 4 — Orthopaedics",  x:16, y:28, w:10, h:20, cur:1, cap:1 },
      { id:"or-5",     label:"OR 5 — Cardiac Sx",    x:30, y:2,  w:10, h:22, cur:1, cap:1 },
      { id:"or-6",     label:"OR 6 — Neurosurgery",  x:30, y:28, w:10, h:20, cur:0, cap:1 },
      { id:"or-7",     label:"OR 7 — Plastics",      x:44, y:2,  w:10, h:22, cur:1, cap:1 },
      { id:"or-8",     label:"OR 8 — Gynaecology",   x:44, y:28, w:10, h:20, cur:1, cap:1 },
      // Perioperative — (x:58)
      { id:"pre-op",   label:"Pre-Op Assessment",    x:58, y:2,  w:14, h:22, cur:8,  cap:14 },
      { id:"pacu",     label:"Recovery (PACU)",       x:58, y:28, w:14, h:20, cur:6,  cap:12 },
      // Day surgery + endoscopy — (x:76)
      { id:"day-sx",   label:"Day Surgery Unit",      x:76, y:2,  w:12, h:22, cur:5,  cap:10 },
      { id:"endo",     label:"Endoscopy Suite",       x:76, y:28, w:12, h:20, cur:4,  cap:6  },
      // Interventional procedures — (x:92)
      { id:"interv",   label:"Interventional Proc.",  x:92, y:2,  w:6,  h:46, cur:3,  cap:4  },
    ],
  },

  // ── FLOOR 2 ─────────────────────────────────────────────────────────────────
  // Layout: Large MICU (left, full height) | SICU + CCU | HDU + Cardiac Step-Down
  //         | Neuro ICU + Burn & Wound Care
  { id:"2", label:"Floor 2", name:"Floor 2 — Intensive Care & Critical Units",
    depts:[
      // Medical ICU — full-height Col A+B (x:2–38, w:36)
      { id:"micu",       label:"Medical ICU (MICU)",   x:2,  y:2,  w:36, h:46, cur:16, cap:20 },
      // Surgical & Cardiac ICU — Col C (x:42–64, w:22)
      { id:"sicu",       label:"Surgical ICU (SICU)",  x:42, y:2,  w:22, h:22, cur:8,  cap:10 },
      { id:"ccu",        label:"Cardiac Care Unit",    x:42, y:28, w:22, h:20, cur:7,  cap:10 },
      // Step-down units — Col D (x:68–82, w:14)
      { id:"step-card",  label:"Cardiac Step-Down",    x:68, y:2,  w:14, h:22, cur:10, cap:14 },
      { id:"step-med",   label:"Medical Step-Down",    x:68, y:28, w:14, h:20, cur:9,  cap:12 },
      // Specialised critical — Col E (x:86–98, w:12)
      { id:"neuro-icu",  label:"Neuro ICU",            x:86, y:2,  w:12, h:22, cur:6,  cap:8  },
      { id:"burn-wound", label:"Burn & Wound Care",    x:86, y:28, w:12, h:20, cur:4,  cap:6  },
    ],
  },

  // ── FLOOR 3 ─────────────────────────────────────────────────────────────────
  // Layout: Cardiology | General Medicine | Neurology + Nephrology
  //         | GI + Rheumatology | Physician Consulting (Col E, full height)
  { id:"3", label:"Floor 3", name:"Floor 3 — Medical Wards & Physician Clinics",
    depts:[
      // Col A (x:2–24)
      { id:"card-ward",  label:"Cardiology Ward",      x:2,  y:2,  w:22, h:22, cur:20, cap:24 },
      { id:"resp-ward",  label:"Respiratory Ward",     x:2,  y:28, w:22, h:20, cur:16, cap:22 },
      // Col B (x:28–50)
      { id:"gen-med-a",  label:"General Medicine A",   x:28, y:2,  w:22, h:22, cur:18, cap:24 },
      { id:"gen-med-b",  label:"General Medicine B",   x:28, y:28, w:22, h:20, cur:20, cap:24 },
      // Col C (x:54–70)
      { id:"neuro-ward", label:"Neurology Ward",       x:54, y:2,  w:16, h:22, cur:14, cap:18 },
      { id:"nephro",     label:"Nephrology / Dialysis",x:54, y:28, w:16, h:20, cur:12, cap:16 },
      // Col D (x:74–88)
      { id:"gastro",     label:"Gastroenterology",     x:74, y:2,  w:14, h:22, cur:8,  cap:12 },
      { id:"rheum",      label:"Rheumatology Clinic",  x:74, y:28, w:14, h:20, cur:6,  cap:10 },
      // Col E (x:92–98) — Physician consulting rooms, full height
      { id:"phys-consult",label:"Physician Consulting",x:92, y:2,  w:6,  h:46, cur:8,  cap:16 },
    ],
  },

  // ── FLOOR 4 ─────────────────────────────────────────────────────────────────
  // Layout: Maternity (Labour & Birthing) | NICU + Maternity Ward
  //         | Paediatrics | Nursery + Gynaecology | Antenatal (Col E)
  { id:"4", label:"Floor 4", name:"Floor 4 — Maternity, NICU & Paediatrics",
    depts:[
      // Col A (x:2–24)
      { id:"labour-del", label:"Labour & Delivery",    x:2,  y:2,  w:22, h:22, cur:6,  cap:8  },
      { id:"birth-ste",  label:"Birthing Suites",      x:2,  y:28, w:22, h:20, cur:4,  cap:6  },
      // Col B (x:28–50)
      { id:"nicu",       label:"NICU",                 x:28, y:2,  w:22, h:22, cur:9,  cap:12 },
      { id:"mat-ward",   label:"Maternity Ward",       x:28, y:28, w:22, h:20, cur:14, cap:20 },
      // Col C (x:54–70)
      { id:"peds-ward",  label:"Paediatrics Ward",     x:54, y:2,  w:16, h:22, cur:12, cap:18 },
      { id:"peds-oc",    label:"Paed. Day Treatment",  x:54, y:28, w:16, h:20, cur:8,  cap:12 },
      // Col D (x:74–88)
      { id:"nursery",    label:"Nursery",              x:74, y:2,  w:14, h:22, cur:6,  cap:10 },
      { id:"gyn-clinic", label:"Gynaecology Clinic",   x:74, y:28, w:14, h:20, cur:7,  cap:12 },
      // Col E (x:92–98) — Antenatal consulting, full height
      { id:"antenatal",  label:"Antenatal Clinic",     x:92, y:2,  w:6,  h:46, cur:5,  cap:10 },
    ],
  },

  // ── FLOOR 5 ─────────────────────────────────────────────────────────────────
  // Layout: Oncology (Chemo + Ward) | Radiation + Palliative
  //         | Mental Health | Rehab (Physio + OT) | Wound Care (Col E)
  { id:"5", label:"Floor 5", name:"Floor 5 — Oncology, Mental Health & Rehabilitation",
    depts:[
      // Col A (x:2–24)
      { id:"chemo",      label:"Chemotherapy Suite",   x:2,  y:2,  w:22, h:22, cur:10, cap:16 },
      { id:"onc-ward",   label:"Oncology Ward",        x:2,  y:28, w:22, h:20, cur:9,  cap:14 },
      // Col B (x:28–50)
      { id:"rad-onc",    label:"Radiation Oncology",   x:28, y:2,  w:22, h:22, cur:4,  cap:6  },
      { id:"palliative", label:"Palliative Care",      x:28, y:28, w:22, h:20, cur:8,  cap:12 },
      // Col C (x:54–70)
      { id:"mh-acute",   label:"Mental Health Acute",  x:54, y:2,  w:16, h:22, cur:16, cap:20 },
      { id:"mh-op",      label:"Psychiatry Outpatient",x:54, y:28, w:16, h:20, cur:8,  cap:12 },
      // Col D (x:74–88)
      { id:"physio",     label:"Physiotherapy",        x:74, y:2,  w:14, h:22, cur:12, cap:18 },
      { id:"occ-ther",   label:"Occupational Therapy", x:74, y:28, w:14, h:20, cur:9,  cap:14 },
      // Col E (x:92–98) — Speech + Wound clinic, stacked
      { id:"speech",     label:"Speech Therapy",       x:92, y:2,  w:6,  h:22, cur:4,  cap:8  },
      { id:"wound-c",    label:"Wound Care Clinic",    x:92, y:28, w:6,  h:20, cur:3,  cap:8  },
    ],
  },
];

// Floor world-Y positions (g=0, 1..5 stacked at 2.2-unit intervals)
const FLOOR_Y_MAP = { g:0, "1":2.2, "2":4.4, "3":6.6, "4":8.8, "5":11.0 };
const FLOOR_CENTER_Y = 5.5; // midpoint of 6 floors

function occ3dColor(occ) {
  if (occ >= 80) return 0xD4706A;
  if (occ >= 50) return 0xD4974A;
  return 0x5BAA8A;
}
function occ3dHex(occ) {
  if (occ >= 80) return "#D4706A";
  if (occ >= 50) return "#D4974A";
  return "#5BAA8A";
}

function NyghFloorPlan({ floors = NYGH_FLOORS, hospitalName, hospitalAddress }) {
  // Compute Y positions dynamically so any uploaded floor plan works
  const floorYMap = {};
  floors.forEach((f, i) => { floorYMap[f.id] = i * 2.2; });
  const floorCenterY = ((floors.length - 1) * 2.2) / 2;

  const mountRef      = useRef(null);
  const tooltipRef    = useRef({ setInfo: null });
  const controlsRef   = useRef(null);
  const floorGroupsRef= useRef({});    // floorId → THREE.Group
  const camTargetRef  = useRef(new THREE.Vector3(0, floorCenterY, 0));
  const [tooltipInfo, setTooltipInfo] = useState(null);
  const [mousePos,    setMousePos]    = useState({ x: 0, y: 0 });
  const [activeFloor, setActiveFloor] = useState(null);
  const activeRef = useRef(null); // mirrors activeFloor for use inside animation loop

  tooltipRef.current.setInfo = setTooltipInfo;
  activeRef.current = activeFloor;

  // Isolate / reveal floors whenever activeFloor changes
  useEffect(() => {
    Object.entries(floorGroupsRef.current).forEach(([id, grp]) => {
      grp.visible = activeFloor === null || activeFloor === id;
    });
    const fy = activeFloor !== null ? floorYMap[activeFloor] : floorCenterY;
    camTargetRef.current.set(0, fy + 0.4, 0);
  }, [activeFloor]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let W = mount.clientWidth  || mount.offsetWidth  || 700;
    let H = mount.clientHeight || mount.offsetHeight || 420;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
    camera.position.set(12, 14, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Helpers ──────────────────────────────────────────────────────────────
    function holoBox(w, h, d, color, edgeOp = 0.85, fillOp = 0.04) {
      const geo     = new THREE.BoxGeometry(w, h, d);
      const edges   = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: edgeOp, blending: THREE.AdditiveBlending, depthWrite: false });
      const fillMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: fillOp, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
      const g = new THREE.Group();
      g.add(new THREE.LineSegments(edges, edgeMat));
      g.add(new THREE.Mesh(geo, fillMat));
      return g;
    }

    function makeSprite(text, color = "#5BAA8A", canvasW = 220, fontSize = 14) {
      const canvas = document.createElement("canvas");
      canvas.width = canvasW; canvas.height = 32;
      const ctx = canvas.getContext("2d");
      ctx.font = `bold ${fontSize}px 'DM Mono', monospace`;
      ctx.fillStyle = color;
      ctx.fillText(text.toUpperCase(), 4, 22);
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(canvasW / 32, 1, 1);
      return sprite;
    }

    // ── Constants ─────────────────────────────────────────────────────────────
    // SVG 0-100 → 3D -5..5  (scale 0.1, offset -5)
    // SVG 0-50  → 3D -2.5..2.5 (scale 0.1, offset -2.5)
    // Gap between rooms in SVG = 4 units → 0.4 units in 3D (clear separation)
    const SC = 0.1, OX = -5, OZ = -2.5;
    const BOX_H   = 0.30;
    const PLATE_H = 0.07;
    const INSET   = 0.12; // gap inset per side

    const deptMaterials = []; // { floorId, edgeMat, fillMat, edgeOp, fillOp }
    const deptHitMeshes = []; // for raycasting

    floors.forEach(floor => {
      const fy  = floorYMap[floor.id];
      const grp = new THREE.Group();

      // Floor plate (slightly wider than dept area)
      const plate = holoBox(10.5, PLATE_H, 5.5, 0x5BAA8A, 0.28, 0.03);
      plate.position.set(0, fy, 0);
      grp.add(plate);

      // Floor label on the left
      const floorLbl = makeSprite(floor.label, "#5BAA8A", 160, 13);
      floorLbl.position.set(-7.4, fy + 0.35, 0);
      floorLbl.scale.set(3.2, 0.72, 1);
      grp.add(floorLbl);

      floor.depts.forEach(dept => {
        const occ      = Math.round((dept.cur / dept.cap) * 100);
        const color    = occ3dColor(occ);
        const colorHex = occ3dHex(occ);

        // Map SVG → 3D with inset gap
        const cx = (dept.x + dept.w / 2) * SC + OX;
        const cz = (dept.y + dept.h / 2) * SC + OZ;
        const w  = dept.w * SC - INSET;
        const d  = dept.h * SC - INSET;

        const edgeOp = 0.88, fillOp = 0.07;
        const geo     = new THREE.BoxGeometry(w, BOX_H, d);
        const edges   = new THREE.EdgesGeometry(geo);
        const edgeMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: edgeOp, blending: THREE.AdditiveBlending, depthWrite: false });
        const fillMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: fillOp, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
        const deptGrp = new THREE.Group();
        deptGrp.add(new THREE.LineSegments(edges, edgeMat));
        deptGrp.add(new THREE.Mesh(geo, fillMat));
        deptGrp.position.set(cx, fy + BOX_H / 2, cz);
        grp.add(deptGrp);

        deptMaterials.push({ floorId: floor.id, edgeMat, fillMat, edgeOp, fillOp });

        // Dept name label
        const lbl = makeSprite(dept.label, colorHex, 200, 12);
        lbl.position.set(cx, fy + BOX_H + 0.36, cz);
        lbl.scale.set(Math.max(w * 1.1, 1.9), 0.44, 1);
        grp.add(lbl);

        // Capacity label "cur / cap"
        const pplLbl = makeSprite(`${dept.cur} / ${dept.cap}`, colorHex, 130, 12);
        pplLbl.position.set(cx, fy + BOX_H + 0.74, cz);
        pplLbl.scale.set(Math.max(w * 0.85, 1.3), 0.36, 1);
        grp.add(pplLbl);

        // Invisible hit mesh for raycasting
        const hitMesh = new THREE.Mesh(
          new THREE.BoxGeometry(w, BOX_H + 0.3, d),
          new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
        );
        hitMesh.position.set(cx, fy + BOX_H / 2, cz);
        hitMesh.userData = { floorId: floor.id, label: dept.label, cur: dept.cur, cap: dept.cap, occ };
        grp.add(hitMesh);
        deptHitMeshes.push(hitMesh);
      });

      scene.add(grp);
      floorGroupsRef.current[floor.id] = grp;
    });

    // ── Ground grid ───────────────────────────────────────────────────────────
    const grid = new THREE.GridHelper(24, 24, 0x5BAA8A, 0x5BAA8A);
    grid.material.opacity = 0.05;
    grid.material.transparent = true;
    grid.position.y = -0.5;
    scene.add(grid);

    // ── Ground glow rings ─────────────────────────────────────────────────────
    [6, 10].forEach((r, i) => {
      const geo = new THREE.RingGeometry(r - 0.06, r, 64);
      const mat = new THREE.MeshBasicMaterial({ color: i === 0 ? 0xD4706A : 0x5BAA8A, transparent: true, opacity: i === 0 ? 0.3 : 0.15, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.48;
      scene.add(ring);
    });

    // ── Particles ─────────────────────────────────────────────────────────────
    const N = 90;
    const pPos   = new Float32Array(N * 3);
    const pSpeed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r     = 9 + Math.random() * 10;
      pPos[i*3]   = Math.cos(angle) * r;
      pPos[i*3+1] = Math.random() * (floorCenterY * 2 + 2);
      pPos[i*3+2] = Math.sin(angle) * r;
      pSpeed[i]   = 0.007 + Math.random() * 0.012;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x5BAA8A, size: 0.07, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })));

    // ── OrbitControls ─────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping   = true;
    controls.dampingFactor   = 0.04;
    controls.minDistance     = 5;
    controls.maxDistance     = 45;
    controls.maxPolarAngle   = Math.PI * 0.54;
    controls.autoRotate      = true;
    controls.autoRotateSpeed = 0.45;
    controls.target.set(0, floorCenterY, 0);
    controlsRef.current = controls;
    renderer.domElement.addEventListener("pointerdown", () => { controls.autoRotate = false; });
    renderer.domElement.addEventListener("pointerup",   () => { controls.autoRotate = true; });

    // ── Raycaster ─────────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();
    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(deptHitMeshes, false);
      if (hits.length > 0) {
        const ud = hits[0].object.userData;
        tooltipRef.current.setInfo({ label: ud.label, cur: ud.cur, cap: ud.cap, occ: ud.occ, color: occ3dHex(ud.occ), msg: ud.occ >= 80 ? "No beds available" : ud.occ >= 50 ? "Short wait — filling up" : "Beds available" });
        mount.style.cursor = "pointer";
      } else {
        tooltipRef.current.setInfo(null);
        mount.style.cursor = "grab";
      }
    };
    mount.addEventListener("mousemove", onMouseMove);

    // ── Animation ─────────────────────────────────────────────────────────────
    let frame;
    const clock   = new THREE.Clock();
    const posAttr = pGeo.attributes.position;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      deptMaterials.forEach(({ floorId, edgeMat, fillMat, edgeOp, fillOp }) => {
        const active = activeRef.current;
        const on     = active === null || active === floorId;
        const pulse  = on ? 0.8 + Math.sin(t * 1.6) * 0.18 : 1;
        edgeMat.opacity = on ? edgeOp * pulse : 0.08;
        fillMat.opacity = on ? fillOp * pulse : 0.01;
      });
      for (let i = 0; i < N; i++) {
        posAttr.array[i*3+1] += pSpeed[i];
        if (posAttr.array[i*3+1] > floorCenterY * 2 + 2) posAttr.array[i*3+1] = 0;
      }
      posAttr.needsUpdate = true;
      controls.target.lerp(camTargetRef.current, 0.06);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      W = mount.clientWidth  || mount.offsetWidth  || 700;
      H = mount.clientHeight || mount.offsetHeight || 420;
      if (W === 0 || H === 0) return;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => onResize());
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      mount.removeEventListener("mousemove", onMouseMove);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <Card style={{ marginTop:18 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, color:T.ink }}>
            {hospitalName ? `${hospitalName} — Floor Plan 3D` : "Floor Plan — 3D"}
          </div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.12em", textTransform:"uppercase", marginTop:2 }}>
            {hospitalAddress || (hospitalName ? hospitalName : "North York General · 4001 Leslie St")} · Drag to rotate · Hover for details
          </div>
        </div>
        <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
          {[["Full (≥80% cap)",T.rose],["Busy (50–79%)",T.amber],["Available (<50%)",T.vital]].map(([l,c])=>(
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:c, opacity:.85 }}/>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.06em" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:5, marginBottom:10, flexWrap:"wrap" }}>
        <button onClick={()=>setActiveFloor(null)}
          style={{ padding:"5px 13px", borderRadius:7, border:`1.5px solid ${activeFloor===null?T.rose:T.border}`, background:activeFloor===null?T.roseTint:"transparent", fontFamily:"'DM Mono',monospace", fontSize:9, color:activeFloor===null?T.rose:T.inkFaint, cursor:"pointer", letterSpacing:"0.07em", transition:"all .15s" }}>
          All Floors
        </button>
        {floors.map(f=>(
          <button key={f.id} onClick={()=>setActiveFloor(activeFloor===f.id?null:f.id)}
            style={{ padding:"5px 13px", borderRadius:7, border:`1.5px solid ${activeFloor===f.id?T.rose:T.border}`, background:activeFloor===f.id?T.roseTint:"transparent", fontFamily:"'DM Mono',monospace", fontSize:9, color:activeFloor===f.id?T.rose:T.inkFaint, cursor:"pointer", letterSpacing:"0.07em", transition:"all .15s" }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ position:"relative" }}>
        <div
          ref={mountRef}
          style={{ width:"100%", height:420, borderRadius:12, overflow:"hidden", background:"linear-gradient(135deg,rgba(4,16,12,.96),rgba(6,18,14,.92))", cursor:"grab" }}
          onMouseMove={e=>setMousePos({ x:e.clientX, y:e.clientY })}
          onMouseDown={e=>{ e.currentTarget.style.cursor="grabbing"; }}
          onMouseUp={e=>{ e.currentTarget.style.cursor="grab"; }}
        />
        {tooltipInfo && (
          <div style={{ position:"fixed", left:mousePos.x+18, top:mousePos.y-10, minWidth:158, background:"rgba(4,20,18,.93)", border:`1px solid ${tooltipInfo.color}55`, borderRadius:9, padding:"10px 14px", pointerEvents:"none", zIndex:1000, backdropFilter:"blur(6px)", boxShadow:`0 0 22px ${tooltipInfo.color}22,0 2px 8px rgba(0,0,0,.5)` }}>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:12, color:"#fff", marginBottom:3 }}>{tooltipInfo.label}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:tooltipInfo.color, letterSpacing:"0.06em" }}>{tooltipInfo.cur} / {tooltipInfo.cap} patients</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:"rgba(255,255,255,.5)", marginTop:3, letterSpacing:"0.04em" }}>{tooltipInfo.msg}</div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── FLOOR PLAN PDF UPLOADER ──────────────────────────────────────────────────
async function extractPdfText(file) {
  // use legacy mjs build import that works with Vite resolver
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += `\n--- Page ${i} ---\n` + content.items.map(it => it.str).join(" ");
  }
  return text.trim();
}

function FloorPlanUploader({ onFloors, onHospitalInfo }) {
  const [apiKey,   setApiKey]   = useState(() => localStorage.getItem("groq_fp_key") || "");
  const [file,     setFile]     = useState(null);
  const [status,   setStatus]   = useState("idle");
  const [errMsg,   setErrMsg]   = useState("");
  const [expanded, setExpanded] = useState(false);

  const saveKey = (k) => { setApiKey(k); localStorage.setItem("groq_fp_key", k); };

  const analyze = async () => {
    if (!file || !apiKey.trim()) return;
    setStatus("loading"); setErrMsg("");
    try {
      const pdfText = await extractPdfText(file);
      if (!pdfText) throw new Error("Could not extract text from PDF. Make sure it is a text-based PDF, not a scanned image.");

      const prompt = `You are a hospital floor plan parser. Below is extracted text from a hospital floor plan PDF. Identify the hospital name, address, all floors and rooms/departments.

Return ONLY valid JSON (no markdown, no extra text) in this exact schema:
{
  "hospital": "Full Hospital Name",
  "address": "Street Address, City, Province",
  "floors": [
    {
      "id": "g",
      "label": "Ground Floor",
      "name": "Ground Floor — <main departments listed here>",
      "depts": [
        { "id": "dept-slug", "label": "Department Name", "x": 2, "y": 2, "w": 22, "h": 10, "cur": 18, "cap": 20 }
      ]
    }
  ]
}

Rules:
- x/y/w/h use a 0-100 (x-axis) by 0-50 (y-axis) coordinate space. Distribute rooms logically so they fill the space, leave 4-unit gaps between rooms.
- cur = estimated current patient count (integer). Use realistic numbers based on room type and capacity. Default to 50% of cap if unknown.
- cap = estimated maximum patient capacity (integer) based on room type and size. ORs have cap 1, ICU beds ~20, wards ~24, waiting rooms ~40.
- id must be lowercase URL-safe slugs (no spaces, use hyphens).
- Include every floor as a separate entry in "floors", ordered ground floor to top floor.
- If floor count is unclear, create at least one floor with all detected rooms/departments.
- If hospital name is not found, use the PDF filename or "Unknown Hospital".
- Ensure every dept has x, y, w, h, cur, cap — no field may be missing or null.

PDF TEXT:
${pdfText.slice(0, 12000)}`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.1,
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) { const t = await res.text(); throw new Error(t); }
      const data = await res.json();
      const raw  = data.choices?.[0]?.message?.content || "{}";
      const json = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(json);

      // Support both the new wrapped schema and the legacy bare-array schema
      let floors;
      if (Array.isArray(parsed)) {
        floors = parsed;
      } else if (parsed.floors && Array.isArray(parsed.floors)) {
        floors = parsed.floors;
        if (onHospitalInfo) onHospitalInfo({ name: parsed.hospital || file.name, address: parsed.address || "" });
      } else {
        throw new Error("Unexpected response shape — no floors found.");
      }

      if (floors.length === 0) throw new Error("No floors extracted. Try a different PDF.");

      // Normalise: if AI still sent occ instead of cur/cap, convert
      floors = floors.map(f => ({
        ...f,
        depts: (f.depts || []).map(d => {
          if (d.cur == null && d.occ != null && d.cap != null) {
            return { ...d, cur: Math.round((d.occ / 100) * d.cap) };
          }
          if (d.cur == null) return { ...d, cur: Math.round((d.cap || 20) * 0.5) };
          if (d.cap == null) return { ...d, cap: Math.max(d.cur * 2, 10) };
          return d;
        }),
      }));

      onFloors(floors);
      setStatus("done");
    } catch (e) {
      setErrMsg(e.message?.slice(0, 220) || "Unknown error");
      setStatus("error");
    }
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setExpanded(x => !x)}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: T.roseTint, border: `1.5px solid ${T.rose}45`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📄</div>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, color: T.ink }}>Upload Hospital Floor Plan PDF</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>Powered by Groq AI · Free · Updates 3D hologram</div>
          </div>
        </div>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.inkFaint }}>{expanded ? "▲ hide" : "▼ expand"}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 5 }}>Groq API Key <span style={{ color: T.vital, fontSize: 11 }}>(free — no credit card)</span></div>
            <input
              type="password"
              value={apiKey}
              onChange={e => saveKey(e.target.value)}
              placeholder="gsk_…"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontFamily: "'DM Mono',monospace", fontSize: 12, color: T.ink, background: T.bgDeep, outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.inkFaint, marginTop: 4, letterSpacing: "0.06em" }}>Saved in localStorage · Get a free key at console.groq.com</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: T.inkMid, marginBottom: 5 }}>Floor Plan PDF <span style={{ color: T.inkFaint, fontSize: 11 }}>(must be text-based, not scanned)</span></div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: `1.5px dashed ${file ? T.vital : T.border}`, background: file ? T.vitalPale : "transparent", cursor: "pointer" }}>
              <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { setFile(e.target.files[0]); setStatus("idle"); }} />
              <span style={{ fontSize: 18 }}>{file ? "✅" : "📁"}</span>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: file ? T.vital : T.inkFaint }}>
                {file ? file.name : "Click to choose a PDF…"}
              </span>
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="btn-primary"
              onClick={analyze}
              disabled={!file || !apiKey.trim() || status === "loading"}
              style={{ opacity: (!file || !apiKey.trim() || status === "loading") ? 0.5 : 1, cursor: (!file || !apiKey.trim() || status === "loading") ? "not-allowed" : "pointer" }}
            >
              {status === "loading" ? "Extracting & Analyzing…" : "Analyze & Update 3D Map →"}
            </button>
            {status === "done"  && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.vital }}>✓ Floor plan updated!</span>}
            {status === "error" && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.rose }}>✗ {errMsg}</span>}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── CAPACITY EDITOR ──────────────────────────────────────────────────────────
function CapacityEditor({ floors, onSave }) {
  const [expanded,  setExpanded]  = useState(false);
  const [activeTab, setActiveTab] = useState(floors[0]?.id ?? "");
  // draft holds { [floorId]: { [deptId]: { cur, cap } } }
  const [draft, setDraft] = useState(() => {
    const d = {};
    floors.forEach(f => {
      d[f.id] = {};
      f.depts.forEach(dept => { d[f.id][dept.id] = { cur: dept.cur, cap: dept.cap }; });
    });
    return d;
  });

  const setVal = (fid, did, field, val) => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 0) return;
    setDraft(prev => ({
      ...prev,
      [fid]: { ...prev[fid], [did]: { ...prev[fid][did], [field]: n } },
    }));
  };

  const apply = () => {
    const updated = floors.map(f => ({
      ...f,
      depts: f.depts.map(dept => ({
        ...dept,
        cur: draft[f.id]?.[dept.id]?.cur ?? dept.cur,
        cap: draft[f.id]?.[dept.id]?.cap ?? dept.cap,
      })),
    }));
    onSave(updated);
  };

  const activeFloor = floors.find(f => f.id === activeTab);

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }} onClick={() => setExpanded(x => !x)}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:`${T.amber}18`, border:`1.5px solid ${T.amber}45`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>✏️</div>
          <div>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, color:T.ink }}>Edit Room Occupancy</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.1em", textTransform:"uppercase" }}>Set current patients &amp; max capacity · Rebuilds 3D map</div>
          </div>
        </div>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:T.inkFaint }}>{expanded ? "▲ hide" : "▼ expand"}</span>
      </div>

      {expanded && (
        <div style={{ marginTop:14, borderTop:`1px solid ${T.border}`, paddingTop:14 }}>
          {/* Floor tabs */}
          <div style={{ display:"flex", gap:5, marginBottom:14, flexWrap:"wrap" }}>
            {floors.map(f => (
              <button key={f.id} onClick={() => setActiveTab(f.id)}
                style={{ padding:"4px 12px", borderRadius:6, border:`1.5px solid ${activeTab===f.id?T.amber:T.border}`, background:activeTab===f.id?`${T.amber}15`:"transparent", fontFamily:"'DM Mono',monospace", fontSize:9, color:activeTab===f.id?T.amber:T.inkFaint, cursor:"pointer", letterSpacing:"0.07em" }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Column headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:8, marginBottom:14 }}>
            {activeFloor && activeFloor.depts.map(dept => {
              const curVal = draft[activeTab]?.[dept.id]?.cur ?? dept.cur;
              const capVal = draft[activeTab]?.[dept.id]?.cap ?? dept.cap;
              const occ    = capVal > 0 ? Math.round((curVal / capVal) * 100) : 0;
              const col    = occ >= 80 ? T.rose : occ >= 50 ? T.amber : T.vital;
              return (
                <div key={dept.id} style={{ padding:"10px 12px", borderRadius:9, border:`1.5px solid ${col}35`, background:`${col}08`, display:"flex", flexDirection:"column", gap:7 }}>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:12, color:T.ink, lineHeight:1.3 }}>{dept.label}</div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, marginBottom:3, letterSpacing:"0.06em" }}>CURRENT</div>
                      <input
                        type="number" min={0} max={capVal} value={curVal}
                        onChange={e => setVal(activeTab, dept.id, "cur", e.target.value)}
                        style={{ width:"100%", padding:"4px 7px", borderRadius:6, border:`1.5px solid ${col}55`, fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700, color:col, background:T.bgDeep, outline:"none", textAlign:"center", boxSizing:"border-box" }}
                      />
                    </div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:14, color:T.inkFaint, paddingTop:14 }}>/</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, marginBottom:3, letterSpacing:"0.06em" }}>MAX CAP</div>
                      <input
                        type="number" min={1} value={capVal}
                        onChange={e => setVal(activeTab, dept.id, "cap", e.target.value)}
                        style={{ width:"100%", padding:"4px 7px", borderRadius:6, border:`1.5px solid ${T.border}`, fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700, color:T.inkMid, background:T.bgDeep, outline:"none", textAlign:"center", boxSizing:"border-box" }}
                      />
                    </div>
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:col, letterSpacing:"0.06em" }}>
                    {occ}% · {occ >= 80 ? "No beds available" : occ >= 50 ? "Short wait" : "Available"}
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn-primary" onClick={apply} style={{ fontSize:12 }}>
            Apply Changes → Rebuild 3D Map
          </button>
        </div>
      )}
    </Card>
  );
}

// ─── PATIENT DATA ─────────────────────────────────────────────────────────────
const PATIENTS = [
  { id:"MRN-24891", name:"Thomas Leclerc",    age:47, sex:"M", dob:"1978-04-12", room:"ED-07",   doctor:"Dr. Sharma", apptTime:"10:00", sev:4, status:"In Treatment",
    complaint:"Acute abdominal pain, nausea × 6h", diagnosis:"Suspected appendicitis",
    vitals:{ bp:"138/92", hr:104, temp:38.4, o2:97 },
    allergies:["Penicillin"], meds:["Morphine 4mg IV","Ondansetron 4mg IV"], notes:"Presage AI flags possible appendicitis. Urgent surgical consult ordered." },
  { id:"MRN-24892", name:"Jordan Mitchell",   age:60, sex:"M", dob:"1965-09-03", room:"CARD-12", doctor:"Dr. Sharma", apptTime:"09:00", sev:2, status:"Waiting",
    complaint:"Cardiac follow-up, mild exertional dyspnea", diagnosis:"Stable angina — routine follow-up",
    vitals:{ bp:"122/78", hr:72, temp:36.8, o2:98 },
    allergies:[], meds:["Atorvastatin 40mg","Aspirin 81mg","Metoprolol 25mg"], notes:"Last Echo normal. Stress test booked for next month." },
  { id:"MRN-24893", name:"Priya Nair",        age:36, sex:"F", dob:"1990-02-17", room:"OPD-03",  doctor:"Dr. Patel",  apptTime:"09:30", sev:1, status:"Waiting",
    complaint:"Annual physical examination", diagnosis:"Routine preventive care",
    vitals:{ bp:"118/74", hr:68, temp:36.6, o2:99 },
    allergies:["Sulfa drugs"], meds:["Levothyroxine 50mcg"], notes:"Bloodwork ordered. BMI 23.1. No concerns." },
  { id:"MRN-24894", name:"Mohammed Al-Amin",  age:55, sex:"M", dob:"1970-06-05", room:"INTM-08", doctor:"Dr. Sharma", apptTime:"11:00", sev:3, status:"In Treatment",
    complaint:"Hypertension follow-up, persistent frontal headache × 2d", diagnosis:"Uncontrolled hypertension",
    vitals:{ bp:"168/102", hr:88, temp:37.1, o2:96 },
    allergies:["ACE inhibitors"], meds:["Amlodipine 10mg","Hydrochlorothiazide 25mg"], notes:"BP elevated despite current regimen. Considering adding losartan." },
  { id:"MRN-24895", name:"Ana Reyes",         age:70, sex:"F", dob:"1955-11-28", room:"GERI-04", doctor:"Dr. Chen",   apptTime:"10:30", sev:1, status:"Waiting",
    complaint:"Chronic disease management, prescription renewal", diagnosis:"T2 Diabetes & Hypertension",
    vitals:{ bp:"134/82", hr:76, temp:36.7, o2:97 },
    allergies:["NSAIDs"], meds:["Metformin 1000mg","Lisinopril 10mg","Amlodipine 5mg"], notes:"HbA1c 7.2% — well controlled. Foot exam completed." },
  { id:"MRN-24896", name:"Sarah Kim",         age:41, sex:"F", dob:"1985-03-22", room:"LAB-02",  doctor:"Dr. Chen",   apptTime:"09:00", sev:1, status:"Discharged",
    complaint:"Thyroid panel result review", diagnosis:"Hypothyroidism — stable",
    vitals:{ bp:"116/72", hr:64, temp:36.5, o2:99 },
    allergies:[], meds:["Levothyroxine 75mcg"], notes:"TSH 2.4 mIU/L — within range. No dose change needed." },
  { id:"MRN-24897", name:"Robert Green",      age:63, sex:"M", dob:"1963-07-14", room:"CCU-03",  doctor:"Dr. Sharma", apptTime:"08:30", sev:5, status:"Critical",
    complaint:"Chest pain, diaphoresis, radiating to left arm × 45min", diagnosis:"STEMI — anterior wall",
    vitals:{ bp:"88/58", hr:118, temp:37.0, o2:91 },
    allergies:["Heparin (HIT)"], meds:["Aspirin 325mg","Clopidogrel 600mg","Nitroglycerin IV"], notes:"Cath lab activated. PCI in progress. Family notified." },
  { id:"MRN-24898", name:"Fatima Hassan",     age:29, sex:"F", dob:"1997-01-09", room:"LD-01",   doctor:"Dr. Patel",  apptTime:"07:45", sev:2, status:"In Treatment",
    complaint:"Active labour, G2P1, 39+2 weeks, ROM 3h ago", diagnosis:"Active labour — term pregnancy",
    vitals:{ bp:"126/80", hr:92, temp:36.9, o2:99 },
    allergies:[], meds:["Oxytocin 10 units/hr IV"], notes:"Contractions q3min × 60sec. Fetal HR 142bpm — reassuring. Epidural placed." },
];

const DOCTORS = [
  { id: "D-001", name: "Dr. Sharma", specialty: "Cardiology", status: "Active", patients: 12, rating: 4.8 },
  { id: "D-002", name: "Dr. Patel",  specialty: "Obstetrics",  status: "Surgery", patients: 8,  rating: 4.9 },
  { id: "D-003", name: "Dr. Chen",   specialty: "Geriatrics",  status: "Active", patients: 15, rating: 4.7 },
  { id: "D-004", name: "Dr. Wright", specialty: "Emergency",   status: "On Break", patients: 0, rating: 4.6 },
  { id: "D-005", name: "Dr. Kim",    specialty: "Internal Medicine", status: "Active", patients: 10, rating: 4.8 },
];

function PatientCard({ p, onRemove }) {
  const [open, setOpen] = useState(false);
  const sc  = p.sev >= 5 ? T.roseDeep : p.sev >= 4 ? T.rose : p.sev >= 3 ? T.amber : T.vital;
  const stc = p.status === "Critical" ? T.roseDeep : p.status === "In Treatment" ? T.amber : p.status === "Discharged" ? T.inkFaint : T.vital;
  const VitalChip = ({ label, val, warn }) => (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"6px 10px", borderRadius:8, background:warn?`${T.rose}12`:`${T.vital}08`, border:`1px solid ${warn?T.rose:T.vital}22` }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:700, color:warn?T.rose:T.ink }}>{val}</div>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7.5, color:T.inkFaint, letterSpacing:"0.08em" }}>{label}</div>
    </div>
  );
  return (
    <div style={{ borderRadius:12, border:`1.5px solid ${sc}${open?"55":"22"}`, background:open?`${sc}06`:"transparent", marginBottom:8, overflow:"hidden", transition:"all .2s" }}>
      {/* Header row */}
      <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", cursor:"pointer" }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:`${sc}18`, border:`2px solid ${sc}44`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:14, color:sc, flexShrink:0 }}>{p.name.charAt(0)}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:13, color:T.ink }}>{p.name}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.06em" }}>{p.id}</div>
          </div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.inkFaint, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.complaint}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
          <div style={{ display:"flex", gap:5 }}>
            <div style={{ padding:"2px 7px", borderRadius:5, background:`${sc}15`, fontFamily:"'DM Mono',monospace", fontSize:7, color:sc, letterSpacing:"0.1em" }}>SEV {p.sev}</div>
            <div style={{ padding:"2px 7px", borderRadius:5, background:`${stc}12`, fontFamily:"'DM Mono',monospace", fontSize:7, color:stc, letterSpacing:"0.08em" }}>{p.status.toUpperCase()}</div>
          </div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint }}>{p.room} · {p.apptTime} · {p.doctor}</div>
        </div>
        {onRemove && (
          <button
            onClick={e => { e.stopPropagation(); onRemove(p); }}
            title="Remove from queue"
            style={{ marginLeft:4, border:"none", background:"transparent", color:T.inkFaint, cursor:"pointer", fontSize:14, padding:"4px 6px", borderRadius:6, transition:"all .2s", lineHeight:1 }}
            onMouseEnter={e => { e.target.style.color = T.roseDeep; e.target.style.background = `${T.rose}15`; }}
            onMouseLeave={e => { e.target.style.color = T.inkFaint; e.target.style.background = "transparent"; }}
          >✕</button>
        )}
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:T.inkFaint, marginLeft:4 }}>{open?"▲":"▼"}</div>
      </div>

      {/* Expanded details */}
      {open && (
        <div style={{ padding:"0 14px 14px", borderTop:`1px solid ${sc}18` }}>
          {/* Vitals — only show if real data exists */}
          {p.vitals && p.vitals.bp !== "--" && (
            <div style={{ display:"flex", gap:8, margin:"12px 0 10px" }}>
              <VitalChip label="BP" val={p.vitals.bp} warn={parseInt(p.vitals.bp)>140}/>
              <VitalChip label="HR bpm" val={p.vitals.hr} warn={p.vitals.hr>100||p.vitals.hr<55}/>
              <VitalChip label="Temp °C" val={p.vitals.temp} warn={p.vitals.temp>37.5}/>
              <VitalChip label="SpO₂ %" val={p.vitals.o2} warn={p.vitals.o2<95}/>
            </div>
          )}
          {/* Health Card info — show when available */}
          {p.healthCard && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, margin:"12px 0 10px", padding:"12px 14px", borderRadius:10, background:`${T.vital}08`, border:`1px solid ${T.vital}22` }}>
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.vital, marginBottom:3, letterSpacing:"0.08em" }}>FULL NAME</div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.ink, fontWeight:600 }}>{p.healthCard.full_name || "--"}</div>
              </div>
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.vital, marginBottom:3, letterSpacing:"0.08em" }}>CARD NUMBER</div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.ink, fontWeight:600 }}>{p.healthCard.card_number || "--"}</div>
              </div>
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, marginBottom:3, letterSpacing:"0.08em" }}>DATE OF BIRTH</div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.ink }}>{p.healthCard.date_of_birth || "--"}</div>
              </div>
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, marginBottom:3, letterSpacing:"0.08em" }}>GENDER</div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.ink }}>{p.healthCard.gender || "--"}</div>
              </div>
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, marginBottom:3, letterSpacing:"0.08em" }}>VERSION CODE</div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.ink }}>{p.healthCard.version_code || "--"}</div>
              </div>
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, marginBottom:3, letterSpacing:"0.08em" }}>PROVINCE</div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.ink }}>{p.healthCard.province || "--"}</div>
              </div>
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, marginBottom:3, letterSpacing:"0.08em" }}>EXPIRY DATE</div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.ink }}>{p.healthCard.expiry_date || "--"}</div>
              </div>
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, marginBottom:3, letterSpacing:"0.08em" }}>ISSUE DATE</div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.ink }}>{p.healthCard.issue_date || "--"}</div>
              </div>
            </div>
          )}
          {/* Info grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, marginBottom:3, letterSpacing:"0.08em" }}>DIAGNOSIS</div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.ink, fontWeight:600 }}>{p.diagnosis}</div>
            </div>
            {!p.healthCard && p.age && (
            <div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, marginBottom:3, letterSpacing:"0.08em" }}>PATIENT</div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.ink }}>{p.age ? `${p.age}y` : ""} {p.sex} {p.dob ? `· DOB ${p.dob}` : ""}</div>
            </div>
            )}
            <div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.rose, marginBottom:3, letterSpacing:"0.08em" }}>ALLERGIES</div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:p.allergies.length?T.rose:T.inkFaint }}>{p.allergies.length?p.allergies.join(", "):"None known"}</div>
            </div>
            <div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, marginBottom:3, letterSpacing:"0.08em" }}>MEDICATIONS</div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.inkMid, lineHeight:1.5 }}>{p.meds.join(" · ")}</div>
            </div>
          </div>
          {p.notes && (
            <div style={{ padding:"8px 11px", borderRadius:8, background:`${sc}10`, border:`1px solid ${sc}25` }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7.5, color:sc, letterSpacing:"0.08em", marginBottom:3 }}>CLINICAL NOTE</div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkMid, lineHeight:1.5 }}>{p.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DOCTOR PORTAL (/doctor) ──────────────────────────────────────────────────
function DoctorPage() {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") === "doctors" ? "doctors" : "patients");
  const [feedback,       setFeedback]       = useState([]);
  const [incidents,      setIncidents]      = useState([]);
  const [loadingInc,     setLoadingInc]     = useState(true);
  const [lastSync,       setLastSync]       = useState(null);
  const [notifVisible,   setNotifVisible]   = useState(false);
  const notifCountRef = useRef(0);
  const [searchDoctor,   setSearchDoctor]   = useState("");
  const [searchPatient,  setSearchPatient]  = useState("");
  const [filterSev,      setFilterSev]      = useState(0); // 0 = all

  const fetchFeedback = () => {
    fetch(`${API_BASE}/api/feedback`)
      .then(r => r.json())
      .then(data => setFeedback(Array.isArray(data) ? data : []))
      .catch(err => console.error("feedback fetch:", err));
  };

  const handleDeleteFeedback = (id) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;
    fetch(`${API_BASE}/api/feedback/${id}`, { method: "DELETE" })
      .then(r => {
        if (r.ok) fetchFeedback();
        else alert("Failed to delete feedback");
      }).catch(console.error);
  };

  // fetch incidents — always uses API_BASE, never hardcoded
  const fetchInc = async () => {
    setLoadingInc(true);
    try {
      const res = await fetch(`${API_BASE}/api/incidents`);
      if (res.ok) {
        const data = await res.json();
        setIncidents(Array.isArray(data) ? data : []);
        setLastSync(new Date());
      } else {
        console.error("incidents fetch: HTTP", res.status);
      }
    } catch (e) {
      console.error("incidents fetch:", e);
    } finally {
      setLoadingInc(false);
    }
  };

  // Re-fetch on every navigation to this page + poll every 8 s
  const location = useLocation();
  useEffect(() => {
    fetchFeedback();
    fetchInc();
    const iv = setInterval(fetchInc, 8000);
    return () => clearInterval(iv);
  }, [location.pathname]);

  // show notification banner when new incident arrives
  useEffect(() => {
    if (incidents.length > notifCountRef.current) {
      setNotifVisible(true);
      notifCountRef.current = incidents.length;
      setTimeout(() => setNotifVisible(false), 5000);
    }
  }, [incidents]);

  const filteredFeedback = feedback.filter(f => searchDoctor === "" || (f.doctorName || "").toLowerCase().includes(searchDoctor.toLowerCase()));

  const handleDeleteIncident = (patient) => {
    if (!patient._incidentId) return;
    if (!confirm(`Remove ${patient.name} from the queue?`)) return;
    fetch(`${API_BASE}/api/incidents/${patient._incidentId}`, { method: "DELETE" })
      .then(r => { if (r.ok) setIncidents(prev => prev.filter(inc => inc._id !== patient._incidentId)); })
      .catch(console.error);
  };

  // Map MongoDB triage records → PatientCard-compatible objects
  const incidentPatients = incidents.map(i => {
    const hc  = i.healthCard || {};
    const cat = i.category || "routine";

    // Age: only compute when DOB is a valid, non-empty date string
    let age = null;
    if (hc.date_of_birth) {
      const ms = Date.now() - new Date(hc.date_of_birth).getTime();
      if (!isNaN(ms)) age = Math.floor(ms / 31557600000);
    }

    const sev    = cat === "emergency" ? 5 : cat === "urgent" ? 4 : 2;
    const status = cat === "emergency" ? "Critical" : cat === "urgent" ? "In Treatment" : "Waiting";

    return {
      _incidentId: i._id,
      id:          hc.card_number || i.patient?.email || String(i._id),
      name:        hc.full_name   || i.patient?.name  || "Unknown Patient",
      age,
      sex:         hc.gender ? hc.gender.charAt(0).toUpperCase() : "",
      dob:         hc.date_of_birth || "",
      room:        "",
      doctor:      "",
      apptTime:    i.timestamp ? new Date(i.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      sev,
      status,
      complaint:   i.symptoms || i.message || "",
      diagnosis:   i.message  || "",
      vitals:      null,
      healthCard:  Object.keys(hc).length > 0 ? hc : null,
      allergies:   [],
      meds:        [],
      notes:       `Presage AI Triage: ${cat.toUpperCase()}\n${i.message || ""}`.trim(),
    };
  });

  // Patient Info tab always shows live MongoDB data; Doctors tab uses static demo list
  const patientSource = incidentPatients;

  const filteredPatients = patientSource
    .filter(p => filterSev === 0 || p.sev === filterSev)
    .filter(p => searchPatient === "" || p.name.toLowerCase().includes(searchPatient.toLowerCase()) || p.id.includes(searchPatient))
    .sort((a, b) => b.sev - a.sev);

  const filteredDoctors = DOCTORS.filter(d => searchDoctor === "" || d.name.toLowerCase().includes(searchDoctor.toLowerCase()) || d.specialty.toLowerCase().includes(searchDoctor.toLowerCase()));

  const TAB_BTN = (key, label) => (
    <button onClick={()=>setTab(key)} style={{ padding:"8px 20px", borderRadius:8, border:`1.5px solid ${tab===key?T.rose:T.border}`, background:tab===key?T.roseTint:"transparent", fontFamily:"'Outfit',sans-serif", fontWeight:tab===key?700:400, fontSize:13, color:tab===key?T.rose:T.inkMid, cursor:"pointer", transition:"all .15s" }}>{label}</button>
  );

  return (
    <PageWrap title="Doctor Portal" icon={<Icons.stethoscope/>} subtitle="Clinical dashboard — Dr. Sharma">
      {/* Top nav */}
      {notifVisible && (
        <div style={{ position:"fixed", top:80, right:20, padding:"12px 20px", background:T.rose, color:T.white, borderRadius:8, boxShadow:"0 4px 12px rgba(0,0,0,.2)", zIndex:200 }}>
          New incident recorded
        </div>
      )}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        {TAB_BTN("doctors","👨‍⚕️ Doctors")}
        {TAB_BTN("patients","🧑‍⚕️ Patient Info")}
        <div style={{ flex:1 }}/>
        <button className="btn-ghost" style={{ fontSize:12, padding:"8px 18px" }} onClick={()=>navigate("/rooms")}>Room assignment</button>
        <button className="btn-ghost" style={{ fontSize:12, padding:"8px 18px" }} onClick={()=>navigate("/schedule")}>Scheduling</button>
        <button className="btn-ghost" style={{ fontSize:12, padding:"8px 18px" }} onClick={fetchInc}>Refresh Incidents</button>
      </div>

      {/* ── Doctors Tab (Floorplan replacement) ── */}
      {tab === "doctors" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, alignItems:"start" }}>
          <Card>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <SHead>Medical Staff</SHead>
              <input type="text" placeholder="Search doctor or specialty…" value={searchDoctor} onChange={e=>setSearchDoctor(e.target.value)}
                style={{ padding:"7px 13px", borderRadius:9, border:`1.5px solid ${T.border}`, background:T.bgDeep, fontFamily:"'Outfit',sans-serif", fontSize:12, outline:"none", width:200 }}/>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filteredDoctors.map(d => (
                <div key={d.id} style={{ padding:"12px 14px", borderRadius:12, border:`1.5px solid ${T.border}`, display:"flex", alignItems:"center", gap:12, background:T.surfaceHard }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", background:T.roseTint, display:"flex", alignItems:"center", justifyContent:"center", color:T.rose, fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:15 }}>{d.name[4]}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, color:T.ink }}>{d.name}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.08em", marginTop:2 }}>{d.specialty} · {d.id}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ padding:"2px 8px", borderRadius:6, background: d.status==="Active" ? `${T.vital}15` : d.status==="Surgery" ? `${T.rose}15` : `${T.amber}15`, color: d.status==="Active" ? T.vital : d.status==="Surgery" ? T.rose : T.amber, fontFamily:"'DM Mono',monospace", fontSize:7, letterSpacing:"0.08em", fontWeight:700 }}>{d.status.toUpperCase()}</div>
                    <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:10, color:T.inkFaint, marginTop:4 }}>{d.patients} patients</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <SHead>Doctor Feedback</SHead>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:100, background:T.vitalPale, border:`1px solid rgba(91,170,138,.3)` }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.vital, letterSpacing:"0.1em", textTransform:"uppercase" }}>Live Reviews</span>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:600, overflowY:"auto" }}>
              {filteredFeedback.length > 0 ? filteredFeedback.map((f,i)=>(
                <div key={f.id || i} style={{ padding:"14px 16px", borderRadius:14, background:T.surfaceHard, border:`1px solid ${T.border}`, position:"relative" }}>
                  <button onClick={() => handleDeleteFeedback(f.id)} 
                    style={{ position:"absolute", top:12, right:12, border:"none", background:"transparent", color:T.inkFaint, cursor:"pointer", fontSize:11, padding:4, borderRadius:6, transition:"all .2s" }}
                    onMouseEnter={e => e.target.style.color = T.rose}
                    onMouseLeave={e => e.target.style.color = T.inkFaint}
                    title="Delete feedback"
                  >
                    ✕
                  </button>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, paddingRight:24 }}>
                    <div>
                      <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, color:T.ink }}>{f.doctorName}</div>
                      <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.inkFaint }}>by {f.patientName}</div>
                    </div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, marginTop:4 }}>{new Date(f.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkMid, lineHeight:1.5 }}><span style={{ color:T.vital, fontWeight:600 }}>✓ </span>{f.liked}</div>
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkMid, marginTop:5, lineHeight:1.5 }}><span style={{ color:T.amber, fontWeight:600 }}>△ </span>{f.improved}</div>
                </div>
              )) : <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:T.inkFaint, textAlign:"center", padding:"30px 0" }}>No feedback found.</div>}
            </div>
          </Card>
        </div>
      )}

      {/* ── Patient Info Tab ── */}
      {tab === "patients" && (
        <>
          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
            <Stat label="Incidents" value={patientSource.length} color={T.rose}/>
            <Stat label="Critical / Urgent" value={patientSource.filter(p=>p.sev>=4).length} color={T.roseDeep}/>
            <Stat label="In Treatment" value={patientSource.filter(p=>p.status==="In Treatment" || p.status==="Critical").length} color={T.amber}/>
            <Stat label="Discharged Today" value={patientSource.filter(p=>p.status==="Discharged").length} color={T.vital}/>
          </div>


          {/* Search + filter */}
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
            <input value={searchPatient} onChange={e=>setSearchPatient(e.target.value)} placeholder="Search by name or MRN…"
              style={{ padding:"7px 13px", borderRadius:9, border:`1.5px solid ${T.border}`, fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.ink, background:T.bgDeep, outline:"none", flex:1, minWidth:160 }}/>
            <div style={{ display:"flex", gap:5 }}>
              {[0,1,2,3,4,5].map(s=>(
                <button key={s} onClick={()=>setFilterSev(s)}
                  style={{ padding:"5px 11px", borderRadius:7, border:`1.5px solid ${filterSev===s?T.rose:T.border}`, background:filterSev===s?T.roseTint:"transparent", fontFamily:"'DM Mono',monospace", fontSize:9, color:filterSev===s?T.rose:T.inkFaint, cursor:"pointer" }}>
                  {s===0?"All":`SEV ${s}`}
                </button>
              ))}
            </div>
          </div>

          {/* Patient cards from MongoDB */}
          <Card>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <SHead>Patient Queue — sorted by severity</SHead>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {loadingInc
                  ? <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.amber, letterSpacing:"0.08em" }}>Syncing…</span>
                  : lastSync && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.inkFaint, letterSpacing:"0.06em" }}>Updated {lastSync.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" })}</span>
                }
                <div style={{ width:7, height:7, borderRadius:"50%", background: loadingInc ? T.amber : T.vital, animation:"pulse 1.5s ease infinite" }}/>
              </div>
            </div>
            {loadingInc && incidentPatients.length === 0 ? (
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:T.inkFaint, textAlign:"center", padding:"40px 0" }}>
                Fetching patient data from MongoDB…
              </div>
            ) : incidentPatients.length === 0 ? (
              <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:T.inkFaint, textAlign:"center", padding:"40px 0" }}>
                No triage incidents in the queue. Patients will appear here after running Presage AI triage.
              </div>
            ) : (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  {filteredPatients.map(p => <PatientCard key={p._incidentId || p.id} p={p} onRemove={p._incidentId ? handleDeleteIncident : null}/>)}
                </div>
                {filteredPatients.length === 0 && (
                  <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:T.inkFaint, textAlign:"center", padding:"20px 0" }}>
                    No patients match the current filter.
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}
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
const APPT_COLORS = [T.rose, T.vital, T.amber, T.roseMid, T.roseDeep];
const INIT_APPTS = [
  { id:1,  patient:"Thomas Leclerc",  type:"Emergency Consult",    doctor:"Dr. Sharma", day:0, hour:9,  min:0,  dur:30, color:T.rose },
  { id:2,  patient:"Maria Santos",    type:"Post-Op Review",       doctor:"Dr. Patel",  day:0, hour:10, min:30, dur:30, color:T.amber },
  { id:3,  patient:"James Wong",      type:"Cardiology Follow-Up", doctor:"Dr. Sharma", day:1, hour:14, min:0,  dur:60, color:T.vital },
  { id:4,  patient:"Sarah Kim",       type:"Lab Results Review",   doctor:"Dr. Chen",   day:2, hour:9,  min:0,  dur:30, color:T.vital },
  { id:5,  patient:"Robert Green",    type:"General Check-Up",     doctor:"Dr. Patel",  day:2, hour:11, min:0,  dur:30, color:T.amber },
  { id:6,  patient:"Anna Mueller",    type:"Specialist Referral",  doctor:"Dr. Sharma", day:3, hour:13, min:30, dur:30, color:T.roseMid },
  { id:7,  patient:"David Park",      type:"Blood Work Review",    doctor:"Dr. Chen",   day:4, hour:10, min:0,  dur:30, color:T.rose },
  // Unscheduled
  { id:8,  patient:"Priya Mehta",     type:"Neurology Consult",    doctor:"Dr. Sharma", day:null, hour:null, min:null, dur:30, color:T.roseDeep },
  { id:9,  patient:"Carlos Rivera",   type:"Pre-Op Assessment",    doctor:"Dr. Patel",  day:null, hour:null, min:null, dur:30, color:T.amber },
  { id:10, patient:"Liu Wei",         type:"Discharge Planning",   doctor:"Dr. Chen",   day:null, hour:null, min:null, dur:30, color:T.vital },
];

const DAYS_LABEL = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri"];
const SLOT_H = 38; // px per 30-min row
const HOURS = Array.from({length:20},(_,i)=>({ h:8+Math.floor(i/2), m:i%2===0?0:30 }));

// Compact queue card (sidebar)
function ApptCard({ appt, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, appt.id)}
      style={{ padding:"5px 8px", borderRadius:8, background:`${appt.color}18`, border:`1.5px solid ${appt.color}55`, cursor:"grab", userSelect:"none", marginBottom:4 }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 2px 10px ${appt.color}33`}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
    >
      <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:10, color:appt.color, lineHeight:1.2 }}>{appt.patient}</div>
      <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:9, color:T.inkMid, marginTop:1 }}>{appt.type}</div>
    </div>
  );
}

// Grid card — absolutely positioned, height driven by duration, bottom-edge drag-resizable
function GridCard({ appt, onDragStart, onRemove, onSetDur }) {
  const [tempDur,    setTempDur]    = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef({ startY:0, startDur:0, latest:appt.dur });

  const activeDur = tempDur ?? appt.dur;
  const cardH     = (activeDur / 30) * SLOT_H - 4;
  const fmtTime   = (h, m) => `${String(h).padStart(2,"0")}:${m===0?"00":"30"}`;
  const endMin    = appt.hour * 60 + appt.min + activeDur;
  const endH      = Math.floor(endMin / 60);
  const endM      = endMin % 60;

  const onResizeDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startY: e.clientY, startDur: appt.dur, latest: appt.dur };
    setIsResizing(true);

    const onMove = (ev) => {
      const deltaPx    = ev.clientY - resizeRef.current.startY;
      const deltaSlots = Math.round(deltaPx / SLOT_H);
      const newDur     = Math.max(30, resizeRef.current.startDur + deltaSlots * 30);
      resizeRef.current.latest = newDur;
      setTempDur(newDur);
    };

    const onUp = () => {
      onSetDur(appt.id, resizeRef.current.latest);
      setTempDur(null);
      setIsResizing(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  };

  return (
    <div
      draggable={!isResizing}
      onDragStart={e => { if (!isResizing) onDragStart(e, appt.id); }}
      style={{
        position:"absolute", top:2, left:2, right:2,
        height: cardH,
        borderRadius:8,
        background:`${appt.color}20`,
        border:`1.5px solid ${appt.color}${isResizing?"aa":"66"}`,
        cursor: isResizing ? "ns-resize" : "grab",
        userSelect:"none",
        zIndex: isResizing ? 10 : 2,
        display:"flex",
        flexDirection:"column",
        padding:"5px 7px 2px",
        overflow:"hidden",
        boxSizing:"border-box",
        boxShadow: isResizing ? `0 4px 18px ${appt.color}44` : "none",
        transition: isResizing ? "none" : "box-shadow .15s",
      }}
      onMouseEnter={e=>{ if(!isResizing) e.currentTarget.style.boxShadow=`0 2px 12px ${appt.color}33`; }}
      onMouseLeave={e=>{ if(!isResizing) e.currentTarget.style.boxShadow="none"; }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:4 }}>
        <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:10, color:appt.color, lineHeight:1.2, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{appt.patient}</div>
        <button onClick={e=>{e.stopPropagation();onRemove(appt.id);}}
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:9, color:T.inkFaint, padding:0, lineHeight:1, flexShrink:0 }}>✕</button>
      </div>
      {cardH > 30 && <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:9, color:T.inkMid, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{appt.type}</div>}
      {cardH > 48 && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7.5, color:T.inkFaint, marginTop:2, letterSpacing:"0.04em" }}>{appt.doctor}</div>}
      {cardH > 26 && (
        <div style={{ marginTop:"auto", fontFamily:"'DM Mono',monospace", fontSize:7.5, color:appt.color, letterSpacing:"0.04em", paddingBottom:12 }}>
          {fmtTime(appt.hour, appt.min)} – {fmtTime(endH, endM)} · {activeDur}min
        </div>
      )}

      {/* ── Resize handle ── */}
      <div
        onMouseDown={onResizeDown}
        title="Drag to resize"
        style={{
          position:"absolute", bottom:0, left:0, right:0, height:12,
          cursor:"ns-resize",
          display:"flex", alignItems:"center", justifyContent:"center",
          borderTop:`1px solid ${appt.color}30`,
          borderBottomLeftRadius:8, borderBottomRightRadius:8,
          background: isResizing ? `${appt.color}25` : `${appt.color}10`,
        }}
      >
        <div style={{ width:24, height:2.5, borderRadius:2, background:`${appt.color}${isResizing?"99":"44"}` }}/>
      </div>
    </div>
  );
}

function SchedulePage() {
  // uses global API_BASE
  const [appts,      setAppts]      = useState(INIT_APPTS);
  const [draggingId, setDraggingId] = useState(null);
  const [hoverSlot,  setHoverSlot]  = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [newForm,    setNewForm]    = useState(null);

  // Load backend appointments and merge with static ones
  useEffect(() => {
    fetch(`${API_BASE}/api/schedule`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!data.length) return;
        const backendAppts = data.map((a, i) => ({
          id: `db-${a._id || i}`,
          patient: a.patient || "Unknown",
          type: a.type || "Urgent Care",
          doctor: a.doctor || "Dr. Sharma",
          day: a.day, hour: a.hour, min: a.min, dur: a.dur || 30,
          color: a.color || T.rose,
          urgent: true,
        }));
        setAppts(prev => {
          const existing = new Set(prev.map(p => `${p.day}-${p.hour}-${p.min}`));
          const newOnes = backendAppts.filter(a => a.day !== null && !existing.has(`${a.day}-${a.hour}-${a.min}`));
          return [...prev, ...newOnes];
        });
      })
      .catch(() => {});
  }, []);

  const unscheduled = appts.filter(a => a.day === null);
  const scheduled   = appts.filter(a => a.day !== null);

  // Returns appointment that STARTS in this slot
  const getAppt = (day, hour, min) =>
    scheduled.find(a => a.day===day && a.hour===hour && a.min===min) ?? null;

  // Returns true if a multi-slot appointment from an EARLIER slot covers this slot
  const isCovered = (day, hour, min) => {
    const slotMin = hour * 60 + min;
    return scheduled.some(a => {
      if (a.day !== day) return false;
      const startMin = a.hour * 60 + a.min;
      return slotMin > startMin && slotMin < startMin + a.dur;
    });
  };

  const setDur = (id, newDur) => setAppts(prev => prev.map(a =>
    a.id === id ? { ...a, dur: Math.max(30, newDur) } : a
  ));

  const onDragStart = (e, id) => {
    setDraggingId(id);
    e.dataTransfer.setData("apptId", String(id));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (e, day, hour, min) => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData("apptId"), 10);
    setAppts(prev => prev.map(a => a.id===id ? {...a, day, hour, min} : a));
    setDraggingId(null); setHoverSlot(null);
  };

  const onDropQueue = (e) => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData("apptId"), 10);
    setAppts(prev => prev.map(a => a.id===id ? {...a, day:null, hour:null, min:null} : a));
    setDraggingId(null); setHoverSlot(null);
  };

  const removeAppt = (id) => setAppts(prev => prev.filter(a => a.id !== id));

  const addAppt = () => {
    if (!newForm?.patient?.trim()) return;
    setAppts(prev => [...prev, {
      id: Date.now(), patient: newForm.patient, type: newForm.type||"Appointment",
      doctor: newForm.doctor||"Dr. Sharma", day:null, hour:null, min:null,
      dur: newForm.dur||30, color: newForm.color||T.rose,
    }]);
    setNewForm(null);
  };

  // Build week label
  const baseDate = new Date(2026, 2, 2); // Mon Mar 2 2026
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const weekLabel = DAYS_LABEL.map((_,i) => {
    const d = new Date(baseDate); d.setDate(baseDate.getDate()+i);
    return d.getDate();
  });

  return (
    <PageWrap title="Schedule" icon={<Icons.calendar/>} subtitle="Drag appointments onto the weekly grid">
      <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>

        {/* ── Unscheduled Queue ── */}
        <div style={{ width:190, flexShrink:0 }}>
          <Card style={{ padding:"12px 12px" }}
            onDragOver={e=>e.preventDefault()}
            onDrop={onDropQueue}
          >
            <SHead>Unscheduled</SHead>
            <div style={{ minHeight:80, borderRadius:8, border:`1.5px dashed ${unscheduled.length===0&&draggingId?T.vital:T.border}`, padding:6, background:unscheduled.length===0&&draggingId?`${T.vital}08`:"transparent", transition:"all .2s" }}>
              {unscheduled.length===0 && !draggingId && (
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.inkFaint, textAlign:"center", padding:"20px 0", letterSpacing:"0.06em" }}>All scheduled</div>
              )}
              {unscheduled.map(a => (
                <div key={a.id} style={{ position:"relative" }}>
                  <ApptCard appt={a} onDragStart={onDragStart} compact/>
                  <button onClick={()=>removeAppt(a.id)} style={{ position:"absolute", top:4, right:4, background:"none", border:"none", cursor:"pointer", fontSize:10, color:T.inkFaint, lineHeight:1, padding:2 }}>✕</button>
                </div>
              ))}
            </div>

            <div style={{ marginTop:10 }}>
              {newForm ? (
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <input placeholder="Patient name" value={newForm.patient||""} onChange={e=>setNewForm(f=>({...f,patient:e.target.value}))}
                    style={{ padding:"5px 8px", borderRadius:7, border:`1.5px solid ${T.border}`, fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.ink, background:T.bgDeep, outline:"none" }} />
                  <input placeholder="Appointment type" value={newForm.type||""} onChange={e=>setNewForm(f=>({...f,type:e.target.value}))}
                    style={{ padding:"5px 8px", borderRadius:7, border:`1.5px solid ${T.border}`, fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.ink, background:T.bgDeep, outline:"none" }} />
                  <input placeholder="Doctor" value={newForm.doctor||""} onChange={e=>setNewForm(f=>({...f,doctor:e.target.value}))}
                    style={{ padding:"5px 8px", borderRadius:7, border:`1.5px solid ${T.border}`, fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.ink, background:T.bgDeep, outline:"none" }} />
                  <select value={newForm.dur||30} onChange={e=>setNewForm(f=>({...f,dur:parseInt(e.target.value,10)}))}
                    style={{ padding:"5px 8px", borderRadius:7, border:`1.5px solid ${T.border}`, fontFamily:"'DM Mono',monospace", fontSize:11, color:T.inkMid, background:T.bgDeep, outline:"none" }}>
                    {[30,60,90,120,150,180].map(d=><option key={d} value={d}>{d} min</option>)}
                  </select>
                  <div style={{ display:"flex", gap:4 }}>
                    {APPT_COLORS.map(c=>(
                      <div key={c} onClick={()=>setNewForm(f=>({...f,color:c}))} style={{ width:16, height:16, borderRadius:"50%", background:c, cursor:"pointer", border:`2px solid ${newForm.color===c?"#fff":"transparent"}`, outline:`2px solid ${newForm.color===c?c:"transparent"}` }}/>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    <button className="btn-primary" onClick={addAppt} style={{ flex:1, fontSize:10, padding:"5px 0" }}>Add</button>
                    <button className="btn-ghost" onClick={()=>setNewForm(null)} style={{ flex:1, fontSize:10, padding:"5px 0" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="btn-ghost" onClick={()=>setNewForm({patient:"",type:"",doctor:"",color:T.rose})}
                  style={{ width:"100%", fontSize:10, padding:"6px 0" }}>+ New Appointment</button>
              )}
            </div>
          </Card>
        </div>

        {/* ── Weekly Grid ── */}
        <div style={{ flex:1, minWidth:0 }}>
          <Card style={{ padding:"12px 14px" }}>
            {/* Week nav */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <button className="btn-ghost" style={{ fontSize:12, padding:"5px 12px" }} onClick={()=>setWeekOffset(w=>w-1)}>‹ Prev</button>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, color:T.ink }}>
                Week of Mar {weekLabel[0]}–{weekLabel[4]}, 2026
              </div>
              <button className="btn-ghost" style={{ fontSize:12, padding:"5px 12px" }} onClick={()=>setWeekOffset(w=>w+1)}>Next ›</button>
            </div>

            {/* Grid */}
            <div style={{ display:"flex", overflow:"auto" }}>
              {/* Time column */}
              <div style={{ width:44, flexShrink:0 }}>
                <div style={{ height:36 }}/>{/* header spacer */}
                {HOURS.map(({h,m},i) => (
                  <div key={i} style={{ height:SLOT_H, display:"flex", alignItems:"flex-start", paddingTop:3, justifyContent:"flex-end", paddingRight:7 }}>
                    {m===0 && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.05em" }}>{String(h).padStart(2,"0")}:00</span>}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {DAYS_SHORT.map((day, di) => (
                <div key={di} style={{ flex:1, minWidth:100, borderLeft:`1px solid ${T.border}` }}>
                  {/* Day header */}
                  <div style={{ height:36, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", borderBottom:`1px solid ${T.border}`, background:T.surfaceHard }}>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.1em" }}>{day.toUpperCase()}</div>
                    <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:16, color:T.ink, lineHeight:1 }}>{weekLabel[di]}</div>
                  </div>

                  {/* Time slots */}
                  {HOURS.map(({h,m}, si) => {
                    const startAppt = getAppt(di, h, m);
                    const covered   = !startAppt && isCovered(di, h, m);
                    const isHov     = !covered && hoverSlot?.day===di && hoverSlot?.hour===h && hoverSlot?.min===m;
                    const isHour    = m===0;
                    return (
                      <div key={si}
                        onDragOver={e=>{ if(!covered){ e.preventDefault(); setHoverSlot({day:di,hour:h,min:m}); } }}
                        onDragLeave={()=>setHoverSlot(null)}
                        onDrop={e=>{ if(!covered) onDrop(e,di,h,m); }}
                        style={{
                          height: SLOT_H,
                          borderBottom: `1px ${isHour?"solid":"dashed"} ${T.border}`,
                          background: covered ? `${T.inkFaint}06` : isHov ? `${T.vital}10` : "transparent",
                          transition:"background .1s",
                          position:"relative",
                          boxSizing:"border-box",
                          overflow:"visible",
                        }}
                      >
                        {isHov && !startAppt && (
                          <div style={{ position:"absolute", inset:2, borderRadius:6, border:`1.5px dashed ${T.vital}`, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 }}>
                            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:T.vital, letterSpacing:"0.08em" }}>DROP</span>
                          </div>
                        )}
                        {startAppt && (
                          <GridCard
                            appt={startAppt}
                            onDragStart={onDragStart}
                            onRemove={removeAppt}
                            onSetDur={setDur}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
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
  const [selectedHospital, setSelectedHospital] = useState(null);

  const hospitalColors = [T.vital, T.rose, T.amber, T.vital, T.vital, T.rose, T.amber, T.vital, T.amber, T.rose, T.vital, T.amber, T.rose, T.vital, T.amber, T.rose, T.vital, T.amber, T.rose, T.vital, T.amber, T.rose, T.vital, T.amber];

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
        if (h.coords) {
          const distance = calculateHaversineDistance(
            userLocation.lat,
            userLocation.lng,
            h.coords.lat,
            h.coords.lng
          );
          return {
            ...h,
            distance: distance,
            duration: estimateDriveTime(distance),
            col: hospitalColors[index % hospitalColors.length],
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
        const parsedHospitals = lines
          .filter(line => line.trim())
          .map((line, i) => {
            const parts = line.split(',');
            const name = parts[0].trim();
            const lat = parseFloat(parts[parts.length - 2]);
            const lng = parseFloat(parts[parts.length - 1]);
            const address = parts.slice(1, -2).join(',').trim();
            const coords = (!isNaN(lat) && !isNaN(lng)) ? { lat, lng } : null;
            return { name, address, coords, col: hospitalColors[i % hospitalColors.length] };
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
            <Card key={i} onClick={()=>setSelectedHospital(i)} accent={h.col} style={{ padding:"16px 18px", outline: selectedHospital === i ? `2px solid ${h.col}` : "none", outlineOffset: -2 }}>
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
        <div style={{ minHeight:500, height:500, borderRadius:20, overflow:"hidden", border:`1px solid ${T.border}`, position:"relative" }}>
          <HospitalMap3D
            hospitals={sortedHospitals}
            userLocation={userLocation}
            selectedHospital={selectedHospital}
            onSelectHospital={setSelectedHospital}
          />
        </div>
      </div>
    </PageWrap>
  );
}

// ─── ROOMS (/rooms) ───────────────────────────────────────────────────────────
function RoomsPage() {
  const [hospitalFloors,  setHospitalFloors]  = useState(NYGH_FLOORS);
  const [floorKey,        setFloorKey]        = useState(0);
  const [hospitalInfo,    setHospitalInfo]    = useState({ name: "North York General Hospital", address: "4001 Leslie St, Toronto, ON" });

  const handleFloors = (floors) => { setHospitalFloors(floors); setFloorKey(k => k + 1); };
  const handleHospitalInfo = (info) => { setHospitalInfo(info); };

  return (
    <PageWrap title="Room Map" icon={<Icons.grid/>} subtitle="Live floor plan · Real-time bed status">
      <FloorPlanUploader onFloors={handleFloors} onHospitalInfo={handleHospitalInfo}/>
      <CapacityEditor floors={hospitalFloors} onSave={handleFloors}/>
      <NyghFloorPlan key={floorKey} floors={hospitalFloors} hospitalName={hospitalInfo.name} hospitalAddress={hospitalInfo.address}/>
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
    [<Icons.brain/>,       "#8B6FBF", "Presage AI Triage",   "Symptom analysis with confidence scoring — powered by Gemini."],
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
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.rose, letterSpacing:"0.16em", textTransform:"uppercase" }}>Powered by Gemini AI · Presage Engine</span>
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
        <Route path="/patient/feedback" element={
          <ProtectedRoute><PatientFeedbackPage/></ProtectedRoute>
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

