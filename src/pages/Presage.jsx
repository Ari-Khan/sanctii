import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Icons } from "../theme";
import { Card } from "../components/SharedUI";

// Helper design tokens since we're splitting but haven't unified the theme yet
// In a real app, these should be imported from theme.js
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

// Re-using bits from App.jsx that Presage needs
function SHead({ children }) {
  return (
    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:"0.18em", textTransform:"uppercase", color:T.inkFaint, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:1, background:T.border }}/>{children}<div style={{ flex:1, height:1, background:T.border }}/>
    </div>
  );
}

function EcgStrip({ bottom, top, opacity, color }) {
  return (
    <div style={{ position:"absolute", left:0, right:0, bottom, top, height:40, pointerEvents:"none", opacity }}>
      <svg width="100%" height="100%" viewBox="0 0 1000 40" preserveAspectRatio="none">
        <path d="M0,20 L100,20 L110,5 L120,35 L130,20 L240,20 L250,8 L260,32 L270,20 L400,20 L410,2 L420,38 L430,20 L600,20 L610,6 L620,34 L630,20 L800,20 L810,4 L820,36 L830,20 L1000,20" fill="none" stroke={color || T.rose} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

export default function PresagePage({ PageWrap }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:`You are Presage, Sanctii's medical triage AI. Respond ONLY in JSON (no markdown fences):{"severity":1-5,"recommendation":"see doctor urgently"|"schedule appointment"|"home care"|"emergency","reasoning":"2 sentence clinical reasoning","homeCareTips":["tip1","tip2","tip3"],"warningSign":"symptom that escalates urgency","confidence":0-100}`,
          messages:[{role:"user",content:`Patient symptoms: ${input}`}] }),
      });
      const data = await res.json();
      setResult(JSON.parse((data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim()));
    } catch { setResult({ severity:0, recommendation:"error", reasoning:"Analysis unavailable. Please try again.", homeCareTips:[], warningSign:"", confidence:0 }); }
    setLoading(false);
  };

  const sc = s => s>=5?T.roseDeep:s>=4?T.rose:s>=3?T.amber:T.vital;
  const sl = s => ["—","Routine","Low Priority","Moderate","Urgent","Critical"][s]||"—";

  return (
    <PageWrap title="Presage AI" icon={<Icons.brain/>} subtitle="Intelligent medical triage">
      <div style={{ maxWidth:740, margin:"0 auto" }}>
        <div style={{ marginBottom:22, padding:"22px 26px", borderRadius:20, background:`linear-gradient(135deg,${T.roseDeep} 0%,#6A1E3A 100%)`, position:"relative", overflow:"hidden" }}>
          <EcgStrip bottom={0} opacity={.2} color={T.white}/>
          <div style={{ color:"rgba(255,255,255,.75)", marginBottom:7 }}><Icons.brain/></div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:22, color:T.white, letterSpacing:"-0.02em" }}>Presage Triage Engine</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:13, color:"rgba(255,255,255,.65)", marginTop:4 }}>AI-powered symptom analysis to help you decide your next step.</div>
        </div>
        <Card style={{ marginBottom:18 }}>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, color:T.ink, marginBottom:3 }}>Describe your symptoms</div>
          <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkFaint, marginBottom:12 }}>Be specific — duration, severity, location, and associated symptoms help Presage give accurate guidance.</div>
          <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="e.g. I've had a headache for 3 days, mild fever around 38°C, sore throat and fatigue…"
            style={{ width:"100%", minHeight:100, padding:"13px 15px", borderRadius:11, border:`1.5px solid ${T.border}`, resize:"vertical", fontFamily:"'Outfit',sans-serif", fontSize:14, color:T.ink, background:T.bgDeep, outline:"none", lineHeight:1.6, transition:"border-color .2s" }}
            onFocus={e=>{ e.target.style.borderColor=T.rose; }} onBlur={e=>{ e.target.style.borderColor=T.border; }}
          />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.1em", textTransform:"uppercase" }}>Powered by Claude · Not medical advice</span>
            <button className="btn-primary" onClick={analyze} disabled={loading||!input.trim()} style={{ opacity:loading||!input.trim()?0.5:1, cursor:loading||!input.trim()?"not-allowed":"pointer" }}>
              {loading?"Analyzing…":"Analyze with Presage →"}
            </button>
          </div>
        </Card>
        {loading && (
          <Card style={{ textAlign:"center", padding:40 }}>
            <svg width="80" height="28" viewBox="0 0 80 28" style={{ marginBottom:14 }}><polyline points="0,14 10,14 14,4 18,24 22,14 32,14 36,9 40,19 44,14 54,14 58,7 62,21 66,14 80,14" fill="none" stroke={T.rose} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="200" style={{ animation:"ecgDraw 1.2s ease infinite" }}/></svg>
            <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:15, color:T.ink, marginBottom:3 }}>Presage is analyzing…</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:13, color:T.inkFaint }}>Cross-referencing symptom patterns with clinical data</div>
          </Card>
        )}
        {result && !loading && (
          <div style={{ animation:"fadeUp .5s ease" }}>
            <div style={{ marginBottom:14, padding:"18px 22px", borderRadius:16, background:`linear-gradient(135deg,${sc(result.severity)}15,${sc(result.severity)}06)`, border:`2px solid ${sc(result.severity)}45`, display:"flex", alignItems:"center", gap:18 }}>
              <div style={{ width:60, height:60, borderRadius:14, background:`${sc(result.severity)}18`, border:`2px solid ${sc(result.severity)}55`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:26, color:sc(result.severity), lineHeight:1 }}>{result.severity}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:sc(result.severity), letterSpacing:"0.1em" }}>LEVEL</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:20, color:sc(result.severity) }}>{sl(result.severity)}</div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:T.inkMid, marginTop:3, lineHeight:1.55 }}>{result.reasoning}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, flexShrink:0 }}>
                <div style={{ padding:"8px 18px", borderRadius:100, background:`${sc(result.severity)}18`, border:`1.5px solid ${sc(result.severity)}55`, fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:12, color:sc(result.severity), textTransform:"capitalize", textAlign:"center" }}>{result.recommendation}</div>
                {result.confidence>0 && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:T.inkFaint, letterSpacing:"0.1em" }}>{result.confidence}% confidence</div>}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {result.homeCareTips?.length>0 && (
                <Card>
                  <SHead>Home Care Tips</SHead>
                  {result.homeCareTips.map((tip,i)=>(
                    <div key={i} style={{ display:"flex", gap:9, marginBottom:9, alignItems:"flex-start" }}>
                      <div style={{ width:18, height:18, borderRadius:"50%", background:T.vitalPale, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}><span style={{ fontSize:9, color:T.vital }}>✓</span></div>
                      <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:T.inkMid, lineHeight:1.5 }}>{tip}</span>
                    </div>
                  ))}
                </Card>
              )}
              {result.warningSign && (
                <Card accent={T.rose} style={{ borderColor:`${T.rose}35` }}>
                  <SHead>Seek Immediate Care If</SHead>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"12px", background:T.roseTint, borderRadius:9 }}>
                    <div style={{ color:T.rose, flexShrink:0, marginTop:1 }}><Icons.heartbeat/></div>
                    <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:T.inkMid, lineHeight:1.6 }}>{result.warningSign}</span>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </PageWrap>
  );
}
