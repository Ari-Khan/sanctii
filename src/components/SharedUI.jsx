import { useState } from "react";
import { T } from "../theme";

export function EcgStrip({ opacity=0.1, color=T.rose, top="auto", bottom="auto" }) {
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

export function BgOrbs() {
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      <div style={{ position:"absolute", top:"-15%", right:"-10%", width:520, height:520, borderRadius:"50%", background:`radial-gradient(circle,${T.rosePale}35 0%,transparent 70%)` }}/>
      <div style={{ position:"absolute", bottom:"-20%", left:"-8%", width:620, height:620, borderRadius:"50%", background:`radial-gradient(circle,rgba(91,170,138,.1) 0%,transparent 65%)` }}/>
      <div style={{ position:"absolute", top:"35%", left:"20%", width:320, height:320, borderRadius:"50%", background:`radial-gradient(circle,rgba(212,151,74,.06) 0%,transparent 70%)` }}/>
    </div>
  );
}

export function Card({ children, style, accent, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="glass-hard" onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ padding:20, cursor:onClick?"pointer":"default", borderColor:hov&&onClick?T.roseMid:accent?`${accent}35`:T.border, boxShadow:hov&&onClick?`0 8px 32px ${T.roseGlow}`:"0 2px 12px rgba(160,80,80,.05)", background:accent?`linear-gradient(145deg,${accent}06,${T.surfaceHard})`:T.surfaceHard, transition:"all .2s ease", ...style }}
    >{children}</div>
  );
}
