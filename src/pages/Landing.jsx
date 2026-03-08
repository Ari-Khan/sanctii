import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { T, Icons } from "../theme";
import { BgOrbs } from "../components/SharedUI";
import { HeroSection } from "../components/Hero";

export default function LandingPage() {
  const { isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    // if (isAuthenticated) navigate("/app", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const FEATURES = [
    [<Icons.brain/>,       "#8B6FBF", "Sanctii AI Triage",   "Symptom analysis with confidence scoring — powered by Gemini."],
    [<Icons.mapPin/>,      T.vital,   "Hospital Routing",    "Nearest facility with live wait times and bed availability."],
    [<Icons.calendar/>,    T.rose,    "Smart Scheduling",    "Book appointments, view slots, and manage your care calendar."],
    [<Icons.stethoscope/>, T.roseMid, "Doctor Portal",       "Clinical dashboards, patient queues, and AI-flagged alerts."],
    [<Icons.shield/>,      T.amber,   "Auth0 Security",      "Enterprise-grade authentication. HIPAA-aligned. SOC 2 Type II."],
    [<Icons.heartbeat/>,   T.vital,   "Live Vitals",         "Real-time health monitoring integrated across all portals."],
    [<Icons.database/>,    "#4B8B3B", "Persistent Storage", "All patient data stored securely in MongoDB for continuity and analytics."],
    [<Icons.code/>,        "#3A7CA5", "Open API",            "Flexible REST endpoints allow custom integrations and third-party extensions."]
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
          {[
            {label:"Features", action:()=>{
              if (featuresRef.current && scrollRef.current) {
                // compute offset relative to scroll container using bounding rects
                const containerRect = scrollRef.current.getBoundingClientRect();
                const targetRect = featuresRef.current.getBoundingClientRect();
                const offset = targetRect.top - containerRect.top + scrollRef.current.scrollTop - 70;
                scrollRef.current.scrollTo({ top: offset, behavior: "smooth" });
              }
            }},
          ].map(item=>(
            <span key={item.label} style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:T.inkFaint, cursor:"pointer", transition:"color .2s" }}
              onMouseEnter={e=>{ e.target.style.color=T.rose; }} onMouseLeave={e=>{ e.target.style.color=T.inkFaint; }}
              onClick={item.action}>
              {item.label}
            </span>
          ))}
          <div style={{ width:1, height:20, background:T.border }}/>
          <button className="btn-ghost" onClick={()=>navigate("/login")} style={{ fontSize:12, padding:"8px 18px" }}>Sign In</button>
          <button className="btn-primary" onClick={()=>navigate("/login")} style={{ fontSize:12, padding:"9px 22px" }}>Get Started →</button>
        </div>
      </div>

      <HeroSection />

      {/* ── FEATURES SECTION ── */}
      <section ref={featuresRef} style={{ padding:"80px 60px 60px", position:"relative" }}>
        <BgOrbs/>

        <div style={{ textAlign:"center", marginBottom:48, position:"relative", zIndex:1 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:"0.18em", textTransform:"uppercase", color:T.inkFaint, marginBottom:12 }}>Platform Capabilities</div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:"clamp(28px,3vw,42px)", color:T.ink, letterSpacing:"-0.03em" }}>
            Everything you need,<br/>
            <span style={{ background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>in one intelligent platform.</span>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16, maxWidth:1100, margin:"0 auto", position:"relative", zIndex:1 }}>
          {FEATURES.map(([ic,c,title,desc], i)=>(
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
          Join Sanctii today, no setup required.
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
          Secured by Auth0 · © 2026 Sanctii Health Technologies
        </div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:T.inkFaint, letterSpacing:"0.1em" }}>v1.0.0</div>
      </div>

    </div>
  );
}
