import { useState, useEffect, useRef } from "react";
import { Icons } from "../theme";
import { Card } from "../components/SharedUI";

// Design tokens
const T = {
  bg: "#F8F0E8", bgDeep: "#F0E4D4", surfaceHard: "#FFFAF4", border: "rgba(200,160,140,0.3)",
  rose: "#D4706A", roseDeep: "#A84040", roseTint: "rgba(212,112,106,0.08)",
  vital: "#5BAA8A", vitalPale: "rgba(91,170,138,0.15)", amber: "#D4974A",
  ink: "#2A1818", inkMid: "#6B4040", inkFaint: "#A08070", white: "#FFFCF8",
};

function SHead({ children }) {
  return (
    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: T.inkFaint, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />{children}<div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

export default function PresagePage({ PageWrap }) {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001"; // backend address

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [vitals, setVitals] = useState({ pulse: "--", breathing: "--", status: "Inactive" });
  const videoRef = useRef(null);

  // 1. Browser Camera Preview (Visual only for user)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setVitals(prev => ({ ...prev, status: "Scanning" }));
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  // 2. Poll Backend for actual Vitals from the C++ Engine
  // (kept for real data but we also simulate locally so the UI stays lively)
  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/vitals/latest`);
        const data = await res.json();
        if (data) setVitals(v => ({ ...v, pulse: data.pulse, breathing: data.breathing }));
      } catch (e) { console.log("Waiting for engine..."); }
    };

    const interval = setInterval(fetchVitals, 15000); // 15s updates from backend
    return () => clearInterval(interval);
  }, []);

  // 3. Local simulation: vitals fluctuate every 5 seconds, sometimes drop out.
  //    If camera feed is dark/black, show no vitals until brightness returns.
  useEffect(() => {
    const checkAndSimulate = () => {
      // helper to determine average brightness of current video frame
      const isDark = () => {
        const vid = videoRef.current;
        // if no stream or not enough data (lid closed pauses), treat as dark
        if (!vid || vid.readyState < 2) return true;
        try {
          const w = vid.videoWidth;
          const h = vid.videoHeight;
          if (w === 0 || h === 0) return true;
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(vid, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let sum = 0;
          for (let i = 0; i < data.length; i += 4) {
            sum += data[i] + data[i + 1] + data[i + 2];
          }
          const avg = sum / (data.length / 4) / 3;
          return avg < 20; // very dark threshold
        } catch (e) {
          return true;
        }
      };

      if (isDark()) {
        setVitals(v => ({ ...v, pulse: "--", breathing: "--" }));
        return;
      }

      setVitals(v => {
        const lost = Math.random() < 0.1;
        return {
          ...v,
          pulse: lost ? "--" : 80 + Math.round((Math.random() - 0.5) * 10),
          breathing: lost ? "--" : 15 + Math.round((Math.random() - 0.5) * 4),
        };
      });
    };

    const sim = setInterval(checkAndSimulate, 5000);
    // run once immediately
    checkAndSimulate();
    return () => clearInterval(sim);
  }, []);

  return (
    <PageWrap title="Presage AI" icon={<Icons.brain />} subtitle="Intelligent medical triage">
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        
        {/* LEFT COLUMN: Symptom Input */}
        <div>
          <Card style={{ marginBottom: 20 }}>
            <SHead>Patient Narrative</SHead>
            <textarea 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Describe your symptoms in detail..."
              style={{ width: "100%", minHeight: 180, padding: 20, borderRadius: 14, border: `1.5px solid ${T.border}`, background: T.bgDeep, outline: "none", fontFamily: "inherit", fontSize: 15 }}
            />
            {triageResult && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: T.vitalPale, color: T.ink }}>
                <strong>Triage result:</strong><br />
                {typeof triageResult === "string" ? (
                  <span>{triageResult.replace(/\\n/g, "\n")}</span>
                ) : triageResult.category ? (
                  <>
                    <em>{triageResult.category}</em>: {(triageResult.explanation||"").replace(/\\n/g, "\n")}
                  </>
                ) : (
                  <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(triageResult, null, 2)}</pre>
                )}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 15 }}>
              <button className="btn-primary" onClick={async () => {
                  if (!input.trim()) return;
                  setLoading(true);
                  setTriageResult(null);
                  try {
                    const res = await fetch(`${API_BASE}/api/triage`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ narrative: input.trim() }),
                    });
                    const data = await res.json();
                    setTriageResult(data.result || data);
                  } catch (e) {
                    console.error("Triage request failed", e);
                    setTriageResult({ error: "Request failed" });
                  } finally {
                    setLoading(false);
                  }
                }} disabled={loading || !input.trim()}>
                {loading ? "Analyzing..." : "Run Clinical Triage →"}
              </button>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Live Monitoring */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Webcam Viewfinder */}
          <Card style={{ padding: 0, overflow: "hidden", position: "relative", height: 220, background: "#1a1010" }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", borderRadius: 100, background: "rgba(0,0,0,0.6)", color: T.white, fontSize: 9, fontFamily: "'DM Mono'", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: vitals.status === "Scanning" ? T.vital : T.rose, animation: "pulse 1.5s infinite" }} />
              {vitals.status}
            </div>
            {!videoRef.current?.srcObject && (
              <button onClick={startCamera} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: T.rose, color: "white", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
                Enable Camera
              </button>
            )}
          </Card>

          {/* Vitals Display */}
          <Card accent={T.rose}>
            <SHead>Biometric Stream</SHead>
            <div style={{ display: "flex", flexDirection: "column", gap: 15, padding: "10px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 10, color: T.inkFaint }}>HEART RATE</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: T.rose, lineHeight: 1 }}>{vitals.pulse} <span style={{ fontSize: 12, fontWeight: 400 }}>BPM</span></div>
                </div>
                <Icons.heartbeat color={T.rose} />
              </div>
              
              <div style={{ height: 1, background: T.border }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 10, color: T.inkFaint }}>RESPIRATION</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: T.vital, lineHeight: 1 }}>{vitals.breathing} <span style={{ fontSize: 12, fontWeight: 400 }}>RPM</span></div>
                </div>
                <Icons.brain color={T.vital} />
              </div>
            </div>
          </Card>

          <div style={{ fontSize: 10, color: T.inkFaint, textAlign: "center", fontStyle: "italic" }}>
            Vitals are simulated locally (pulse ±5 BPM, respiration ±2 RPM) every 5 s (occasionally signal
            drops to “--”); real engine data still polled every 15 s
          </div>
        </div>
      </div>
    </PageWrap>
  );
}