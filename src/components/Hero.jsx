import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { T, Icons } from "../theme";
import HospitalHologram from "./Hologram";

// small helper component for live vitals shown on landing
function LiveVitalsDisplay() {
  const [pulse, setPulse] = useState("--");
  const [resp, setResp] = useState("--");

  useEffect(() => {
    const tick = () => {
      // occasionally drop to '--'
      const down = Math.random() < 0.1;
      setPulse(down ? "--" : 80 + Math.round((Math.random() - 0.5) * 10));
      setResp(down ? "--" : 15 + Math.round((Math.random() - 0.5) * 4));
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);

  const items = [
    ["♥", pulse === "--" ? "--" : `${pulse} bpm`, T.vital],
    ["💨", resp === "--" ? "--" : `${resp} rpm`, T.vital],
    ["🛏", "12 beds", T.vital]
  ];

  return (
    <div style={{ display:"flex", gap:10, flexWrap:"wrap", animation:"fadeUp .8s ease" }}>
      {items.map(([ic,v,c])=>(
        <div key={v} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:100, background:T.surfaceHard, border:`1px solid ${T.border}`, boxShadow:"0 1px 8px rgba(160,80,80,.06)" }}>
          <span style={{ fontSize:11 }}>{ic}</span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:c, letterSpacing:"0.04em" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

export function HeroSection() {
  const navigate = useNavigate();

  return (
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
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.rose, letterSpacing:"0.16em", textTransform:"uppercase" }}>Powered by Gemini AI</span>
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

        {/* Live vitals (dynamic sim for landing page) */}
        <LiveVitalsDisplay />

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
  );
}
