import { useState, useEffect } from "react";

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

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const Icons = {
  cross:       () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8z"/></svg>,
  heartbeat:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  heart:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  stethoscope: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>,
  calendar:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  mapPin:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  grid:        () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  brain:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.04-4.79 3 3 0 0 1-.91-4.43 3 3 0 0 1 .5-5.32A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.04-4.79 3 3 0 0 0 .91-4.43 3 3 0 0 0-.5-5.32A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
  user:        () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  shield:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  card:        () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
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

// ─── MAZE ────────────────────────────────────────────────────────────────────
const NODES = {
  center:   { x:50, y:50, label:"Sanctii",        icon:"cross",       isCenter:true },
  patient:  { x:50, y:14, label:"Patient Portal",  icon:"user",        page:"patient",  col:T.rose },
  doctor:   { x:82, y:32, label:"Doctor Portal",   icon:"stethoscope", page:"doctor",   col:T.roseMid },
  rooms:    { x:82, y:68, label:"Room Map",         icon:"grid",        page:"rooms",    col:T.amber },
  hospital: { x:50, y:86, label:"Find Hospital",   icon:"mapPin",      page:"hospital", col:T.vital },
  presage:  { x:18, y:68, label:"Presage AI",      icon:"brain",       page:"presage",  col:"#8B6FBF" },
  schedule: { x:18, y:32, label:"Schedule",        icon:"calendar",    page:"schedule", col:T.roseMid },
};
const EDGES = [
  {from:"center",to:"patient",wp:[]},{from:"center",to:"doctor",wp:[]},
  {from:"center",to:"rooms",wp:[]},{from:"center",to:"hospital",wp:[]},
  {from:"center",to:"presage",wp:[]},{from:"center",to:"schedule",wp:[]},
  {from:"patient",to:"schedule",wp:[{x:18,y:14}]},
  {from:"doctor",to:"rooms",wp:[{x:93,y:50}]},
  {from:"hospital",to:"presage",wp:[{x:30,y:92}]},
  {from:"schedule",to:"presage",wp:[{x:5,y:50}]},
  {from:"patient",to:"doctor",wp:[{x:72,y:8}]},
  {from:"rooms",to:"hospital",wp:[{x:90,y:82}]},
];
const DECOS=["M 22 5 L 22 22 L 38 22","M 62 5 L 78 5 L 78 18","M 93 44 L 93 56","M 80 82 L 93 82 L 93 95","M 5 62 L 5 88 L 20 88","M 5 12 L 5 28 L 14 28 L 14 44","M 36 92 L 36 96 L 64 96 L 64 92","M 56 8 L 56 4 L 44 4 L 44 14"];

function bfs(from,to){
  const adj={};Object.keys(NODES).forEach(k=>{adj[k]=[];});
  EDGES.forEach(e=>{adj[e.from].push(e.to);adj[e.to].push(e.from);});
  const vis={[from]:true};const q=[[from]];
  while(q.length){const p=q.shift();if(p[p.length-1]===to)return p;(adj[p[p.length-1]]||[]).forEach(nb=>{if(!vis[nb]){vis[nb]=true;q.push([...p,nb]);}});}
  return[from,to];
}
function makeSVG(keys){
  if(keys.length<2)return"";
  let d="";
  keys.forEach((key,i)=>{
    const n=NODES[key];
    if(i===0){d+=`M ${n.x} ${n.y}`;return;}
    const e=EDGES.find(e=>(e.from===keys[i-1]&&e.to===key)||(e.to===keys[i-1]&&e.from===key));
    (e?.wp||[]).forEach(wp=>{d+=` L ${wp.x} ${wp.y}`;});
    d+=` L ${n.x} ${n.y}`;
  });
  return d;
}

function MazeUI({onNavigate,onLogout}){
  const[hov,setHov]=useState(null);
  const[path,setPath]=useState([]);
  useEffect(()=>{setPath(hov&&hov!=="center"?bfs("center",hov):[]);},[hov]);
  const pd=makeSVG(path);
  const ac=hov?NODES[hov]?.col||T.rose:T.rose;

  return(
    <div style={{position:"fixed",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      <BgOrbs/>
      <EcgStrip bottom={0} opacity={0.09}/>
      <EcgStrip top="8%" opacity={0.05} color={T.vital}/>

      {/* Top Nav */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:66,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",borderBottom:`1px solid ${T.border}`,background:"rgba(248,240,232,0.85)",backdropFilter:"blur(20px)",zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`,display:"flex",alignItems:"center",justifyContent:"center",color:T.white,animation:"breathe 3s ease-in-out infinite",flexShrink:0}}>
            <Icons.cross/>
          </div>
          <div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:20,color:T.ink,letterSpacing:"-0.03em"}}>Sanctii</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.inkFaint,letterSpacing:"0.14em",textTransform:"uppercase",marginTop:-2}}>Medical Intelligence Platform</div>
          </div>
        </div>

        {/* Live vitals */}
        <div style={{display:"flex",alignItems:"center",gap:20,padding:"7px 18px",borderRadius:100,background:"rgba(91,170,138,0.08)",border:"1px solid rgba(91,170,138,0.25)"}}>
          {[["♥","72 bpm",T.vital],["⚡","98% SpO₂",T.rose],["🌡","36.6°C",T.amber]].map(([ic,val,c])=>(
            <div key={val} style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:10}}>{ic}</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:c,letterSpacing:"0.04em"}}>{val}</span>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:10}}>
          <button className="btn-ghost" onClick={onLogout} style={{fontSize:12,padding:"8px 20px"}}>Log Out</button>
        </div>
      </div>

      {/* Maze */}
      <div style={{position:"relative",width:"min(76vw,80vh)",height:"min(76vw,80vh)",maxWidth:620,maxHeight:620,marginTop:16,zIndex:10}}>
        <svg viewBox="0 0 100 100" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <marker id="arr" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <polygon points="0 0,5 2.5,0 5" fill={ac} opacity=".9"/>
            </marker>
          </defs>
          {DECOS.map((d,i)=><path key={i} d={d} fill="none" stroke={T.border} strokeWidth=".7" strokeLinecap="round" opacity=".8"/>)}
          {EDGES.map((e,i)=>{
            const f=NODES[e.from];const t=NODES[e.to];
            let d=`M ${f.x} ${f.y}`;(e.wp||[]).forEach(w=>{d+=` L ${w.x} ${w.y}`;});d+=` L ${t.x} ${t.y}`;
            return<path key={i} d={d} fill="none" stroke={T.border} strokeWidth=".6" strokeDasharray="1.5 2" opacity=".55"/>;
          })}
          {pd&&<>
            <path d={pd} fill="none" stroke={ac} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity=".15" filter="url(#glow)"/>
            <path d={pd} fill="none" stroke={ac} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arr)" strokeDasharray="400" style={{animation:"pathAnim .45s cubic-bezier(.4,0,.2,1) forwards"}}/>
          </>}
          {path.map((key,i)=>{const n=NODES[key];return<circle key={key} cx={n.x} cy={n.y} r={i===0?3.5:2.5} fill={i===0?T.roseDeep:ac} opacity=".5" style={{animation:`nodeIn .3s ease ${i*.07}s both`}}/>;
          })}
        </svg>

        {Object.entries(NODES).map(([key,node])=>{
          const isCenter=node.isCenter;const isHov=hov===key;const inPath=path.includes(key);
          const col=node.col||T.rose;const IC=Icons[node.icon];
          return(
            <div key={key}
              onMouseEnter={()=>!isCenter&&setHov(key)}
              onMouseLeave={()=>setHov(null)}
              onClick={()=>!isCenter&&node.page&&onNavigate(node.page)}
              style={{position:"absolute",left:`${node.x}%`,top:`${node.y}%`,transform:"translate(-50%,-50%)",zIndex:20,cursor:isCenter?"default":"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}
            >
              {isHov&&<div style={{position:"absolute",width:isCenter?84:60,height:isCenter?84:60,borderRadius:"50%",border:`1.5px solid ${col}`,animation:"ripple 1s ease-out infinite",pointerEvents:"none"}}/>}
              <div style={{
                width:isCenter?66:50,height:isCenter?66:50,borderRadius:isCenter?"18px":"14px",
                background:isHov||isCenter?`linear-gradient(145deg,${col}ee,${col}aa)`:inPath?`linear-gradient(145deg,${col}35,${col}18)`:T.surfaceHard,
                border:`${isHov?2:1.5}px solid ${isHov||inPath?col:T.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                color:isHov||isCenter?T.white:inPath?col:T.inkFaint,
                boxShadow:isHov?`0 12px 32px ${col}55,0 4px 12px ${col}33`:inPath?`0 0 14px ${col}30`:"0 2px 10px rgba(160,80,80,.06)",
                transition:"all .25s cubic-bezier(.4,0,.2,1)",
                transform:isHov?"scale(1.14)":"scale(1)",
                animation:isCenter?"float 4s ease-in-out infinite":"none",
                backdropFilter:"blur(12px)",
              }}>
                {IC&&<IC/>}
              </div>
              <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:isCenter?700:500,fontSize:isCenter?11:9,color:isHov?col:inPath?col:isCenter?T.inkMid:T.inkFaint,textAlign:"center",whiteSpace:"nowrap",transition:"color .2s",letterSpacing:isCenter?"-0.01em":"0.02em"}}>
                {node.label}
              </div>
              {isHov&&<div style={{position:"absolute",top:"calc(100% + 8px)",background:T.ink,color:T.white,padding:"5px 12px",borderRadius:8,fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",whiteSpace:"nowrap",animation:"fadeIn .15s ease",boxShadow:"0 4px 16px rgba(0,0,0,.2)"}}>Click to enter →</div>}
            </div>
          );
        })}
      </div>

      {/* Status bar */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:42,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",borderTop:`1px solid ${T.border}`,background:"rgba(248,240,232,.75)",backdropFilter:"blur(12px)",zIndex:50}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.inkFaint,letterSpacing:"0.12em",textTransform:"uppercase",opacity:hov?0:1,transition:"opacity .3s"}}>Hover a destination · Optimal path · Click to enter</div>
        {hov&&hov!=="center"&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:ac,letterSpacing:"0.1em",textTransform:"uppercase",animation:"fadeIn .2s ease"}}>◈ {path.length-1} hop{path.length!==2?"s":""} to {NODES[hov]?.label}</div>}
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          {[["System","Online",T.vital],["Auth0","Connected",T.vital],["Presage","Ready",T.rose]].map(([k,v,c])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:c,animation:"pulse 2s ease-in-out infinite"}}/>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.inkFaint,letterSpacing:"0.08em",textTransform:"uppercase"}}>{k}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE WRAPPER ─────────────────────────────────────────────────────────────
function PageWrap({children,onBack,title,icon,subtitle,badge}){
  return(
    <div style={{position:"fixed",inset:0,display:"flex",flexDirection:"column",background:T.bg,overflow:"hidden"}}>
      <BgOrbs/>
      <EcgStrip bottom={0} opacity={.06}/>
      <div style={{position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",gap:14,padding:"0 30px",height:65,background:"rgba(248,240,232,.9)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <button className="btn-ghost" onClick={onBack} style={{padding:"7px 16px",fontSize:12}}>← Maze</button>
        <div style={{width:1,height:26,background:T.border}}/>
        <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`,display:"flex",alignItems:"center",justifyContent:"center",color:T.white,flexShrink:0}}>{icon}</div>
        <div>
          <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:16,color:T.ink,letterSpacing:"-0.01em"}}>{title}</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.inkFaint,letterSpacing:"0.12em",textTransform:"uppercase"}}>{subtitle}</div>
        </div>
        {badge&&<div style={{marginLeft:8}}>{badge}</div>}
        <div style={{marginLeft:"auto",fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:13,color:T.inkFaint,letterSpacing:"-0.01em"}}>Sanctii</div>
      </div>
      <div style={{flex:1,overflow:"auto",padding:"26px 30px",position:"relative",zIndex:1}}>
        <div style={{animation:"fadeUp .4s ease"}}>{children}</div>
      </div>
    </div>
  );
}

function Card({children,style,accent,onClick}){
  const[hov,setHov]=useState(false);
  return(
    <div className="glass-hard" onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{padding:20,cursor:onClick?"pointer":"default",borderColor:hov&&onClick?T.roseMid:accent?`${accent}35`:T.border,boxShadow:hov&&onClick?`0 8px 32px ${T.roseGlow}`:"0 2px 12px rgba(160,80,80,.05)",background:accent?`linear-gradient(145deg,${accent}06,${T.surfaceHard})`:T.surfaceHard,transition:"all .2s ease",...style}}>{children}</div>
  );
}

function Stat({label,value,sub,color}){
  return(
    <Card accent={color} style={{textAlign:"center",padding:"18px 12px"}}>
      <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:32,color:color||T.ink,letterSpacing:"-0.03em"}}>{value}</div>
      {sub&&<div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:color?`${color}99`:T.inkFaint,marginTop:1}}>{sub}</div>}
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",color:T.inkFaint,marginTop:5}}>{label}</div>
    </Card>
  );
}

function SHead({children}){
  return(
    <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",color:T.inkFaint,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:1,background:T.border}}/>{children}<div style={{flex:1,height:1,background:T.border}}/>
    </div>
  );
}

function VChart(){
  const pts=[72,75,71,74,73,76,72,74,70,73,75,72];
  const max=Math.max(...pts);const min=Math.min(...pts);
  const W=150,H=38;
  const y=v=>H-((v-min)/(max-min+1))*H;
  const d=pts.map((v,i)=>`${i===0?"M":"L"} ${(i/(pts.length-1))*W} ${y(v)}`).join(" ");
  return(
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.vital} stopOpacity=".3"/><stop offset="100%" stopColor={T.vital} stopOpacity="0"/></linearGradient></defs>
      <path d={d+` L ${W} ${H} L 0 ${H} Z`} fill="url(#vg)"/>
      <path d={d} fill="none" stroke={T.vital} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── PATIENT PORTAL ───────────────────────────────────────────────────────────
function PatientPortal({onBack}){
  const[tab,setTab]=useState("overview");
  return(
    <PageWrap title="Patient Portal" icon={<Icons.user/>} subtitle="Personal health dashboard" onBack={onBack}
      badge={<div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:100,background:"rgba(91,170,138,.1)",border:"1px solid rgba(91,170,138,.25)"}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:T.vital,animation:"pulse 1.5s ease infinite"}}/><span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.vital,letterSpacing:"0.12em",textTransform:"uppercase"}}>Active</span>
      </div>}
    >
      <div style={{display:"flex",gap:4,marginBottom:20,padding:4,background:T.bgDeep,borderRadius:12,width:"fit-content"}}>
        {["overview","records","prescriptions","messages"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 18px",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:500,fontSize:12,background:tab===t?T.white:"transparent",color:tab===t?T.rose:T.inkFaint,boxShadow:tab===t?"0 2px 8px rgba(160,80,80,.12)":"none",transition:"all .2s",textTransform:"capitalize"}}>{t}</button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <Stat label="Next Appointment" value="Mar 12" sub="09:30 AM" color={T.rose}/>
        <Stat label="Active Scripts" value="3" color={T.roseMid}/>
        <Stat label="Last Visit" value="Feb 18" sub="Dr. Sharma"/>
        <Stat label="Health Score" value="87" sub="Excellent" color={T.vital}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:15,color:T.ink}}>Live Vitals</div>
              <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:100,background:T.vitalPale,border:`1px solid rgba(91,170,138,.3)`}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:T.vital,animation:"pulse 1.5s ease infinite"}}/><span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.vital,letterSpacing:"0.1em",textTransform:"uppercase"}}>Live</span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[["Heart Rate","72","bpm",T.rose,<Icons.heart/>],["Blood Pressure","118/76","mmHg",T.vital,<Icons.heartbeat/>],["SpO₂","98","%","#6B8FDF",<Icons.shield/>]].map(([l,v,u,c,ic])=>(
                <div key={l} style={{padding:"12px 10px",background:`${c}08`,borderRadius:12,border:`1px solid ${c}20`}}>
                  <div style={{color:`${c}88`,marginBottom:5}}>{ic}</div>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:22,color:c,letterSpacing:"-0.02em"}}>{v}<span style={{fontSize:10,fontWeight:400,marginLeft:2}}>{u}</span></div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:T.inkFaint,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.inkFaint,letterSpacing:"0.1em",textTransform:"uppercase"}}>7-day HR trend</div>
              <VChart/>
            </div>
          </Card>
          <Card>
            <SHead>Recent Activity</SHead>
            {[{date:"Feb 18",event:"General Checkup",doctor:"Dr. Sharma",type:"visit"},{date:"Feb 02",event:"Blood Work Results",doctor:"Lab Dept.",type:"lab"},{date:"Jan 29",event:"Prescription Renewed",doctor:"Dr. Sharma",type:"rx"},{date:"Jan 15",event:"Chest X-Ray",doctor:"Radiology",type:"imaging"}].map((item,i)=>{
              const c={visit:T.vital,lab:T.rose,rx:T.amber,imaging:"#6B8FDF"}[item.type];
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:i<3?`1px solid ${T.border}`:"none"}}>
                  <div style={{width:34,height:34,borderRadius:10,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",color:c,flexShrink:0}}>
                    {item.type==="visit"?<Icons.stethoscope/>:item.type==="lab"?<Icons.heartbeat/>:item.type==="imaging"?<Icons.grid/>:<Icons.shield/>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:500,fontSize:13,color:T.ink}}>{item.event}</div>
                    <div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:T.inkFaint,marginTop:1}}>{item.doctor}</div>
                  </div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.inkFaint}}>{item.date}</div>
                </div>
              );
            })}
          </Card>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card style={{background:`linear-gradient(145deg,${T.rose}08,${T.surfaceHard})`,borderColor:`${T.rose}25`}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`,display:"flex",alignItems:"center",justifyContent:"center",color:T.white,fontSize:20,fontWeight:800,fontFamily:"'Outfit',sans-serif"}}>J</div>
              <div>
                <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:15,color:T.ink}}>Jordan Mitchell</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.inkFaint,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}}>HC-4821-0039-JM</div>
              </div>
            </div>
            {[["Blood Type","A+"],["Weight","74 kg"],["Height","178 cm"],["Allergies","Penicillin"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:T.inkFaint}}>{k}</span>
                <span style={{fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:12,color:T.ink}}>{v}</span>
              </div>
            ))}
          </Card>
          <Card accent={T.rose} style={{borderColor:`${T.rose}28`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{color:T.rose}}><Icons.brain/></div>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.rose,letterSpacing:"0.12em",textTransform:"uppercase"}}>Presage AI Insight</span>
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:14,color:T.ink,lineHeight:1.65}}>"Your vitals look stable. Consider scheduling your annual eye exam — last recorded 14 months ago."</div>
            <div style={{marginTop:10,fontFamily:"'DM Mono',monospace",fontSize:8,color:T.inkFaint,letterSpacing:"0.1em",textTransform:"uppercase"}}>Confidence: 94% · Updated today</div>
          </Card>
        </div>
      </div>
    </PageWrap>
  );
}

// ─── DOCTOR PORTAL ────────────────────────────────────────────────────────────
function DoctorPortal({onBack}){
  return(
    <PageWrap title="Doctor Portal" icon={<Icons.stethoscope/>} subtitle="Clinical dashboard — Dr. Sharma" onBack={onBack}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <Stat label="Today's Patients" value="12" color={T.rose}/>
        <Stat label="Pending Reviews" value="4" color={T.amber}/>
        <Stat label="Avg Wait Time" value="18m" sub="−3m from yesterday" color={T.vital}/>
        <Stat label="Critical Alerts" value="1" color={T.roseDeep}/>
      </div>
      <div style={{marginBottom:18,padding:"14px 18px",borderRadius:14,background:`linear-gradient(135deg,${T.roseDeep}10,${T.roseTint})`,border:`1.5px solid ${T.rose}45`,display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:38,height:38,borderRadius:11,background:T.rose,display:"flex",alignItems:"center",justifyContent:"center",color:T.white,animation:"breathe 2s ease-in-out infinite",flexShrink:0}}><Icons.heartbeat/></div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:14,color:T.roseDeep}}>Critical Alert — Thomas Leclerc</div>
          <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:T.inkMid,marginTop:2}}>Presage AI flags possible appendicitis. Severity Level 4. Expedite consultation.</div>
        </div>
        <button className="btn-primary" style={{fontSize:12,padding:"8px 18px",flexShrink:0}}>View Patient →</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16}}>
        <Card>
          <SHead>Today's Queue</SHead>
          {[{name:"Jordan Mitchell",time:"09:00",reason:"Follow-up — cardiac",sev:2},{name:"Priya Nair",time:"09:30",reason:"Annual physical",sev:1},{name:"Thomas Leclerc",time:"10:00",reason:"Acute abdominal pain",sev:4},{name:"Ana Reyes",time:"10:30",reason:"Prescription renewal",sev:1},{name:"Mohammed Al-Amin",time:"11:00",reason:"Hypertension follow-up",sev:3}].map((p,i)=>{
            const sc=p.sev>=4?T.roseDeep:p.sev>=3?T.amber:T.vital;
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<4?`1px solid ${T.border}`:"none",cursor:"pointer",borderRadius:8,transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=T.roseTint;e.currentTarget.style.padding="10px 8px";}}
                onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.padding="10px 0";}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:`${sc}15`,border:`2px solid ${sc}35`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:13,color:sc,flexShrink:0}}>{p.name.charAt(0)}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:13,color:T.ink}}>{p.name}</div>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:T.inkFaint,marginTop:1}}>{p.reason}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.inkFaint}}>{p.time}</div>
                  <div style={{padding:"2px 7px",borderRadius:5,background:`${sc}15`,fontFamily:"'DM Mono',monospace",fontSize:7,color:sc,letterSpacing:"0.1em"}}>SEV {p.sev}</div>
                </div>
              </div>
            );
          })}
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <SHead>Severity Guide</SHead>
            {[[1,T.vital,"Routine / Preventive"],[2,"#8BBF5A","Mild Symptoms"],[3,T.amber,"Moderate — Monitor"],[4,T.rose,"Urgent — Expedite"],[5,T.roseDeep,"Critical — Emergency"]].map(([n,c,l])=>(
              <div key={n} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:26,height:26,borderRadius:7,background:`${c}18`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:12,color:c}}>{n}</div>
                <span style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:T.inkMid}}>{l}</span>
              </div>
            ))}
          </Card>
          <Card accent={T.vital}>
            <SHead>Dept. Capacity</SHead>
            {[["Emergency",85],["General",62],["Cardiology",44],["Radiology",71]].map(([dept,pct])=>(
              <div key={dept} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:T.inkMid}}>{dept}</span>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:pct>70?T.rose:T.vital}}>{pct}%</span>
                </div>
                <div style={{height:4,borderRadius:4,background:T.bgDeep,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,borderRadius:4,background:pct>70?`linear-gradient(90deg,${T.amber},${T.rose})`:`linear-gradient(90deg,${T.vital},#4A9A7A)`,transition:"width .6s ease"}}/>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </PageWrap>
  );
}

// ─── PRESAGE AI ───────────────────────────────────────────────────────────────
function PresagePage({onBack}){
  const[input,setInput]=useState("");
  const[result,setResult]=useState(null);
  const[loading,setLoading]=useState(false);

  const analyze=async()=>{
    if(!input.trim())return;
    setLoading(true);setResult(null);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are Presage, Sanctii's medical triage AI. Respond ONLY in JSON (no markdown):{"severity":1-5,"recommendation":"see doctor urgently"|"schedule appointment"|"home care"|"emergency","reasoning":"2 sentence clinical reasoning","homeCareTips":["tip1","tip2","tip3"],"warningSign":"symptom that escalates urgency","confidence":0-100}`,messages:[{role:"user",content:`Patient symptoms: ${input}`}]})});
      const data=await res.json();
      const text=data.content?.[0]?.text||"{}";
      setResult(JSON.parse(text.replace(/```json|```/g,"").trim()));
    }catch{setResult({severity:0,recommendation:"error",reasoning:"Analysis unavailable. Please try again.",homeCareTips:[],warningSign:"",confidence:0});}
    setLoading(false);
  };

  const sc=s=>s>=5?T.roseDeep:s>=4?T.rose:s>=3?T.amber:T.vital;
  const sl=s=>["—","Routine","Low Priority","Moderate","Urgent","Critical"][s]||"—";

  return(
    <PageWrap title="Presage AI" icon={<Icons.brain/>} subtitle="Intelligent medical triage" onBack={onBack}>
      <div style={{maxWidth:740,margin:"0 auto"}}>
        <div style={{marginBottom:22,padding:"22px 26px",borderRadius:20,background:`linear-gradient(135deg,${T.roseDeep} 0%,#6A1E3A 100%)`,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,top:-20,width:150,height:150,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
          <EcgStrip bottom={0} opacity={.2} color={T.white}/>
          <div style={{color:"rgba(255,255,255,.75)",marginBottom:7}}><Icons.brain/></div>
          <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:22,color:T.white,letterSpacing:"-0.02em"}}>Presage Triage Engine</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:13,color:"rgba(255,255,255,.65)",marginTop:4}}>AI-powered symptom analysis to help you decide your next step.</div>
        </div>

        <Card style={{marginBottom:18}}>
          <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:15,color:T.ink,marginBottom:3}}>Describe your symptoms</div>
          <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:T.inkFaint,marginBottom:12}}>Be specific — duration, severity, location, and associated symptoms help Presage give accurate guidance.</div>
          <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="e.g. I've had a headache for 3 days, mild fever around 38°C, sore throat and fatigue..."
            style={{width:"100%",minHeight:100,padding:"13px 15px",borderRadius:11,border:`1.5px solid ${T.border}`,resize:"vertical",fontFamily:"'Outfit',sans-serif",fontSize:14,color:T.ink,background:T.bgDeep,outline:"none",lineHeight:1.6,transition:"border-color .2s"}}
            onFocus={e=>{e.target.style.borderColor=T.rose;}} onBlur={e=>{e.target.style.borderColor=T.border;}}
          />
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.inkFaint,letterSpacing:"0.1em",textTransform:"uppercase"}}>Powered by Claude · Not medical advice</span>
            <button className="btn-primary" onClick={analyze} disabled={loading||!input.trim()} style={{opacity:loading||!input.trim()?.5:1,cursor:loading||!input.trim()?"not-allowed":"pointer"}}>
              {loading?"Analyzing...":"Analyze with Presage →"}
            </button>
          </div>
        </Card>

        {loading&&(
          <Card style={{textAlign:"center",padding:40}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
              <svg width="80" height="28" viewBox="0 0 80 28"><polyline points="0,14 10,14 14,4 18,24 22,14 32,14 36,9 40,19 44,14 54,14 58,7 62,21 66,14 80,14" fill="none" stroke={T.rose} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="200" style={{animation:"ecgDraw 1.2s ease infinite"}}/></svg>
            </div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:15,color:T.ink,marginBottom:3}}>Presage is analyzing...</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:13,color:T.inkFaint}}>Cross-referencing symptom patterns with clinical data</div>
          </Card>
        )}

        {result&&!loading&&(
          <div style={{animation:"fadeUp .5s ease"}}>
            <div style={{marginBottom:14,padding:"18px 22px",borderRadius:16,background:`linear-gradient(135deg,${sc(result.severity)}15,${sc(result.severity)}06)`,border:`2px solid ${sc(result.severity)}45`,display:"flex",alignItems:"center",gap:18}}>
              <div style={{width:60,height:60,borderRadius:14,background:`${sc(result.severity)}18`,border:`2px solid ${sc(result.severity)}55`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:26,color:sc(result.severity),lineHeight:1}}>{result.severity}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:sc(result.severity),letterSpacing:"0.1em"}}>LEVEL</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:20,color:sc(result.severity),letterSpacing:"-0.01em"}}>{sl(result.severity)}</div>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:13,color:T.inkMid,marginTop:3,lineHeight:1.55}}>{result.reasoning}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,flexShrink:0}}>
                <div style={{padding:"8px 18px",borderRadius:100,background:`${sc(result.severity)}18`,border:`1.5px solid ${sc(result.severity)}55`,fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:12,color:sc(result.severity),textTransform:"capitalize",textAlign:"center"}}>{result.recommendation}</div>
                {result.confidence>0&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.inkFaint,letterSpacing:"0.1em"}}>{result.confidence}% confidence</div>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {result.homeCareTips?.length>0&&(
                <Card>
                  <SHead>Home Care Tips</SHead>
                  {result.homeCareTips.map((tip,i)=>(
                    <div key={i} style={{display:"flex",gap:9,marginBottom:9,alignItems:"flex-start"}}>
                      <div style={{width:18,height:18,borderRadius:"50%",background:T.vitalPale,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}><span style={{fontSize:9,color:T.vital}}>✓</span></div>
                      <span style={{fontFamily:"'Outfit',sans-serif",fontSize:13,color:T.inkMid,lineHeight:1.5}}>{tip}</span>
                    </div>
                  ))}
                </Card>
              )}
              {result.warningSign&&(
                <Card accent={T.rose} style={{borderColor:`${T.rose}35`}}>
                  <SHead>Seek Immediate Care If</SHead>
                  <div style={{display:"flex",gap:10,alignItems:"flex-start",padding:"12px",background:T.roseTint,borderRadius:9}}>
                    <div style={{color:T.rose,flexShrink:0,marginTop:1}}><Icons.heartbeat/></div>
                    <span style={{fontFamily:"'Outfit',sans-serif",fontSize:13,color:T.inkMid,lineHeight:1.6}}>{result.warningSign}</span>
                  </div>
                  <div style={{marginTop:12,fontFamily:"'DM Mono',monospace",fontSize:8,color:T.inkFaint,letterSpacing:"0.1em",textTransform:"uppercase",textAlign:"center"}}>Presage AI · Not a substitute for professional medical advice</div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </PageWrap>
  );
}

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────
function SchedulePage({onBack}){
  const[sel,setSel]=useState(12);
  const slots=["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30"];
  const taken=["09:00","10:00","14:30"];
  return(
    <PageWrap title="Schedule" icon={<Icons.calendar/>} subtitle="Appointments & availability" onBack={onBack}>
      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:18}}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:16,color:T.ink}}>March 2026</div>
              <div style={{display:"flex",gap:5}}>
                <button className="btn-ghost" style={{padding:"5px 11px",fontSize:12}}>‹</button>
                <button className="btn-ghost" style={{padding:"5px 11px",fontSize:12}}>›</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
              {["S","M","T","W","T","F","S"].map((d,i)=>(
                <div key={i} style={{textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:9,color:T.inkFaint,letterSpacing:"0.1em",paddingBottom:6}}>{d}</div>
              ))}
              {Array.from({length:35},(_,i)=>{
                const n=i-6;const day=n>0&&n<=31?n:null;
                const isSel=day===sel;const hasAppt=[3,12,18,24].includes(day);
                return(
                  <div key={i} onClick={()=>day&&setSel(day)} style={{padding:"7px 0",textAlign:"center",borderRadius:8,cursor:day?"pointer":"default",background:isSel?`linear-gradient(135deg,${T.rose},${T.roseDeep})`:"transparent",color:isSel?T.white:day?T.ink:T.border,fontFamily:"'Outfit',sans-serif",fontWeight:isSel?700:400,fontSize:13,transition:"all .15s",position:"relative"}}>
                    {day}{hasAppt&&!isSel&&<div style={{position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:T.rose}}/>}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <SHead>Available Slots — Mar {sel}</SHead>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:7}}>
              {slots.map(s=>{
                const busy=taken.includes(s);
                return(
                  <button key={s} disabled={busy} style={{padding:"9px 0",borderRadius:9,cursor:busy?"not-allowed":"pointer",border:`1.5px solid ${busy?T.border:T.rose}`,background:busy?T.bgDeep:T.roseTint,fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:"0.05em",color:busy?T.inkFaint:T.rose,opacity:busy?.4:1,transition:"all .15s"}}
                    onMouseEnter={e=>{if(!busy){e.currentTarget.style.background=T.rose;e.currentTarget.style.color=T.white;}}}
                    onMouseLeave={e=>{if(!busy){e.currentTarget.style.background=T.roseTint;e.currentTarget.style.color=T.rose;}}}
                  >{s}</button>
                );
              })}
            </div>
          </Card>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card accent={T.rose}>
            <SHead>Upcoming</SHead>
            {[["Mar 12","09:30","Dr. Sharma","Cardiology",T.rose],["Mar 18","14:00","Dr. Patel","Lab Work",T.vital]].map(([date,time,dr,dept,c],i)=>(
              <div key={i} style={{padding:"11px 13px",marginBottom:8,borderRadius:9,background:`${c}08`,border:`1px solid ${c}28`}}>
                <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:15,color:c}}>{date} · {time}</div>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:T.inkMid,marginTop:1}}>{dr} — {dept}</div>
              </div>
            ))}
          </Card>
          <Card>
            <SHead>Current Wait Times</SHead>
            {[["Emergency","4 min",T.vital],["General Practice","18 min",T.rose],["Specialist","32 min",T.amber],["Lab / Diagnostics","11 min",T.vital]].map(([k,v,c])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontFamily:"'Outfit',sans-serif",fontSize:13,color:T.ink}}>{k}</span>
                <div style={{padding:"3px 9px",borderRadius:6,background:`${c}14`,fontFamily:"'DM Mono',monospace",fontSize:10,color:c,letterSpacing:"0.05em"}}>{v}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </PageWrap>
  );
}

// ─── HOSPITAL ────────────────────────────────────────────────────────────────
function HospitalPage({onBack}){
  return(
    <PageWrap title="Find Hospital" icon={<Icons.mapPin/>} subtitle="Nearest facilities & live routing" onBack={onBack}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr",gap:18}}>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <SHead>Nearby Hospitals</SHead>
          {[{name:"St. Michael's Hospital",dist:"1.2 km",wait:"8 min",beds:12,col:T.vital},{name:"Toronto General",dist:"2.8 km",wait:"14 min",beds:8,col:T.rose},{name:"Mount Sinai Hospital",dist:"3.1 km",wait:"22 min",beds:4,col:T.amber},{name:"Sunnybrook Health Centre",dist:"8.4 km",wait:"6 min",beds:18,col:T.vital}].map((h,i)=>(
            <Card key={i} onClick={()=>{}} accent={h.col} style={{padding:"16px 18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                <div>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:14,color:T.ink}}>{h.name}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:T.inkFaint,letterSpacing:"0.08em",marginTop:2}}>{h.dist} away</div>
                </div>
                <div style={{textAlign:"center",padding:"7px 12px",borderRadius:9,background:`${h.col}14`,border:`1px solid ${h.col}35`}}>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:18,color:h.col}}>{h.wait}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:h.col,letterSpacing:"0.12em",textTransform:"uppercase"}}>Avg Wait</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:h.col}}/><span style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:T.inkMid}}>{h.beds} beds available</span>
                </div>
                <button className="btn-ghost" style={{fontSize:10,padding:"5px 12px"}}>Directions →</button>
              </div>
            </Card>
          ))}
        </div>
        <div style={{height:"100%",minHeight:400,borderRadius:20,overflow:"hidden",background:`linear-gradient(135deg,${T.bgDeep} 0%,#E8D8CC 100%)`,border:`1px solid ${T.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
          <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.12}} viewBox="0 0 400 400">
            {Array.from({length:9},(_,i)=>(
              <g key={i}><line x1={i*50} y1="0" x2={i*50} y2="400" stroke={T.rose} strokeWidth=".8"/><line x1="0" y1={i*50} x2="400" y2={i*50} stroke={T.rose} strokeWidth=".8"/></g>
            ))}
            <path d="M 80 200 L 200 200 L 200 120 L 300 120" fill="none" stroke={T.rose} strokeWidth="3" strokeLinecap="round"/>
            <path d="M 40 280 L 160 280 L 200 200" fill="none" stroke={T.amber} strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="200" cy="200" r="10" fill={T.rose} opacity=".6"/>
            <circle cx="300" cy="120" r="8" fill={T.vital} opacity=".7"/>
            <circle cx="40" cy="280" r="8" fill={T.amber} opacity=".7"/>
          </svg>
          <div style={{textAlign:"center",zIndex:1}}>
            <div style={{width:60,height:60,borderRadius:18,background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`,display:"flex",alignItems:"center",justifyContent:"center",color:T.white,margin:"0 auto 14px",animation:"float 3s ease-in-out infinite"}}><Icons.mapPin/></div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:18,color:T.ink}}>Interactive Hospital Map</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:13,color:T.inkFaint,marginTop:5}}>Three.js 3D visualization with live routing</div>
            <button className="btn-primary" style={{marginTop:18,fontSize:13}}>Enable Location →</button>
          </div>
        </div>
      </div>
    </PageWrap>
  );
}

// ─── ROOMS ────────────────────────────────────────────────────────────────────
function RoomsPage({onBack}){
  const rooms=Array.from({length:30},(_,i)=>({id:`${Math.floor(i/6)+1}0${(i%6)+1}`,floor:Math.floor(i/6)+1,status:["occupied","occupied","available","maintenance","occupied","available"][i%6]}));
  const sc=s=>({occupied:T.rose,available:T.vital,maintenance:T.amber}[s]||T.inkFaint);
  const sl=s=>({occupied:"In Use",available:"Free",maintenance:"Maint."}[s]||s);
  return(
    <PageWrap title="Room Map" icon={<Icons.grid/>} subtitle="Live floor plan · Real-time bed status" onBack={onBack}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20,maxWidth:480}}>
        {[["Occupied",T.rose],["Available",T.vital],["Maintenance",T.amber]].map(([s,c])=>(
          <Card key={s} accent={c} style={{textAlign:"center",padding:"14px 10px"}}>
            <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:28,color:c}}>{rooms.filter(r=>r.status===s.toLowerCase()).length}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:"0.12em",color:c,textTransform:"uppercase",marginTop:3}}>{s}</div>
          </Card>
        ))}
      </div>
      {[1,2,3,4,5].map(floor=>(
        <Card key={floor} style={{marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
            <div style={{width:26,height:26,borderRadius:7,background:T.roseTint,border:`1px solid ${T.borderStrong}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:12,color:T.rose}}>{floor}</div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:13,color:T.ink}}>Floor {floor}</div>
            <div style={{marginLeft:"auto",fontFamily:"'DM Mono',monospace",fontSize:8,color:T.inkFaint,letterSpacing:"0.1em",textTransform:"uppercase"}}>{rooms.filter(r=>r.floor===floor&&r.status==="available").length} free of {rooms.filter(r=>r.floor===floor).length}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:7}}>
            {rooms.filter(r=>r.floor===floor).map(r=>(
              <div key={r.id} style={{padding:"11px 5px",borderRadius:9,textAlign:"center",cursor:"pointer",background:`${sc(r.status)}10`,border:`1.5px solid ${sc(r.status)}28`,transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=`${sc(r.status)}20`;e.currentTarget.style.borderColor=sc(r.status);e.currentTarget.style.transform="scale(1.05)";}}
                onMouseLeave={e=>{e.currentTarget.style.background=`${sc(r.status)}10`;e.currentTarget.style.borderColor=`${sc(r.status)}28`;e.currentTarget.style.transform="scale(1)";}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.ink,letterSpacing:"0.04em",marginBottom:3}}>{r.id}</div>
                <div style={{width:6,height:6,borderRadius:"50%",background:sc(r.status),margin:"0 auto 3px"}}/>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:sc(r.status),letterSpacing:"0.07em",textTransform:"uppercase"}}>{sl(r.status)}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </PageWrap>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App({onLogout}){
  const[page,setPage]=useState("home");
  const go=p=>setPage(p);
  const back=()=>setPage("home");
  return(
    <div style={{width:"100vw",height:"100vh",overflow:"hidden",position:"relative"}}>
      <GlobalStyle/>
      <div style={{position:"fixed",top:"-50%",left:"-50%",width:"200%",height:"200%",backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,pointerEvents:"none",zIndex:9999,opacity:.22}}/>
      {page==="home"&&<MazeUI onNavigate={go} onLogout={onLogout}/>}
      {page==="patient"&&<PatientPortal onBack={back}/>}
      {page==="doctor"&&<DoctorPortal onBack={back}/>}
      {page==="presage"&&<PresagePage onBack={back}/>}
      {page==="schedule"&&<SchedulePage onBack={back}/>}
      {page==="hospital"&&<HospitalPage onBack={back}/>}
      {page==="rooms"&&<RoomsPage onBack={back}/>}
    </div>
  );
}
