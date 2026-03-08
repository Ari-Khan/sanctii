import { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../theme";
import { Card } from "../components/SharedUI";

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

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


export default function PresagePage({ PageWrap }) {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
  const { user } = useAuth0();
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [vitals, setVitals] = useState({ pulse: "--", breathing: "--", status: "Inactive" });
  const videoRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [booking, setBooking] = useState(null); // { slot, waitTime, procedureTime }

  // Geolocation + nearest hospital
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(loc);
      fetch("/hospitals.csv").then(r => r.text()).then(text => {
        const hospitals = text.trim().split("\n").filter(l => l.trim()).map(line => {
          const parts = line.split(",");
          const name = parts[0].trim();
          const lat = parseFloat(parts[parts.length - 2]);
          const lng = parseFloat(parts[parts.length - 1]);
          const address = parts.slice(1, -2).join(",").trim();
          const coords = (!isNaN(lat) && !isNaN(lng)) ? { lat, lng } : null;
          return { name, address, coords };
        });
        let nearest = null, minDist = Infinity;
        hospitals.forEach(h => {
          if (!h.coords) return;
          const d = haversine(loc.lat, loc.lng, h.coords.lat, h.coords.lng);
          if (d < minDist) { minDist = d; nearest = { ...h, distance: d }; }
        });
        setNearestHospital(nearest);
      }).catch(() => {});
    }, () => {});
  }, []);

  // Poll backend vitals
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/vitals/latest`);
        const data = await res.json();
        if (data) setVitals(v => ({ ...v, pulse: data.pulse, breathing: data.breathing }));
      } catch (e) {}
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  // Simulate vitals from camera brightness
  useEffect(() => {
    const checkAndSimulate = () => {
      const vid = videoRef.current;
      if (!vid || vid.readyState < 2 || vid.videoWidth === 0) {
        setVitals(v => ({ ...v, pulse: "--", breathing: "--" }));
        return;
      }
      try {
        const canvas = document.createElement("canvas");
        canvas.width = vid.videoWidth; canvas.height = vid.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let sum = 0;
        for (let i = 0; i < d.length; i += 4) sum += d[i] + d[i + 1] + d[i + 2];
        if (sum / (d.length / 4) / 3 < 20) { setVitals(v => ({ ...v, pulse: "--", breathing: "--" })); return; }
      } catch (e) { setVitals(v => ({ ...v, pulse: "--", breathing: "--" })); return; }
      const lost = Math.random() < 0.1;
      setVitals(v => ({ ...v, pulse: lost ? "--" : 80 + Math.round((Math.random() - 0.5) * 10), breathing: lost ? "--" : 15 + Math.round((Math.random() - 0.5) * 4) }));
    };
    const sim = setInterval(checkAndSimulate, 5000);
    checkAndSimulate();
    return () => clearInterval(sim);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setVitals(prev => ({ ...prev, status: "Scanning" }));
    } catch (err) { console.error("Camera access denied", err); }
  };

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setTriageResult(null);
    setBooking(null);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) { setTriageResult("Error: VITE_GEMINI_API_KEY not set in .env"); setLoading(false); return; }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: `You are a clinical triage assistant. A patient reports the following symptoms:\n"""\n${input.trim()}\n"""\nProvide a rating of EMERGENCY, URGENT, or ROUTINE with a brief 1-2 sentence explanation. Respond ONLY in this format: [SEVERITY]: [EXPLANATION]` }]
            }]
          }),
        }
      );
      const data = await res.json();
      if (data.error) { setTriageResult(`Error: ${data.error.message}`); setLoading(false); return; }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Error: No response";
      setTriageResult(text);

      // Notify doctor + auto-schedule for URGENT/EMERGENCY
      const upper = text.toUpperCase();
      const cat = upper.startsWith("EMERGENCY") ? "emergency" : upper.startsWith("URGENT") ? "urgent" : null;
      if (cat && user) {
        // Fetch patient health card
        let healthCard = null;
        try {
          const hcRes = await fetch(`${API_BASE}/api/healthcard?email=${encodeURIComponent(user.email)}`);
          if (hcRes.ok) healthCard = await hcRes.json();
        } catch (_) {}

        const patientInfo = { name: user.name, email: user.email };
        const nh = nearestHospital ? { name: nearestHospital.name, address: nearestHospital.address, distanceKm: nearestHospital.distance } : null;

        // Save triage record to doctor DB
        fetch(`${API_BASE}/api/triage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ narrative: input.trim(), patient: patientInfo, nearestHospital: nh }),
        }).catch(() => {});

        // Auto-schedule appointment and get wait time
        try {
          const schRes = await fetch(`${API_BASE}/api/schedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patient: user.name || user.email,
              severity: cat,
              healthCard,
              symptoms: input.trim(),
              nearestHospital: nh,
            }),
          });
          if (schRes.ok) {
            const schData = await schRes.json();
            setBooking({ slot: schData.slot, waitTime: schData.waitTime, procedureTime: schData.procedureTime });
          }
        } catch (_) {}
      }
    } catch (e) {
      setTriageResult("Error: " + (e.message || "Request failed"));
    } finally {
      setLoading(false);
    }
  };

  // Parse severity from "EMERGENCY: explanation" or object
  const getSeverity = r => {
    if (!r) return null;
    if (typeof r === "string") return r.split(":")[0].trim().toUpperCase();
    if (r.category) return String(r.category).toUpperCase();
    return null;
  };

  const severity = getSeverity(triageResult);
  const isEmergency = severity === "EMERGENCY";
  const isUrgent = severity === "URGENT";

  const resultText = triageResult
    ? typeof triageResult === "string"
      ? triageResult.includes(":") ? triageResult.split(":").slice(1).join(":").trim() : triageResult
      : triageResult.explanation || triageResult.message || JSON.stringify(triageResult)
    : null;

  return (
    <PageWrap title="Presage AI" icon={<Icons.brain />} subtitle="Intelligent medical triage · Powered by Gemini">
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>

        {/* LEFT: Symptom input + results */}
        <div>
          <Card style={{ marginBottom: 20 }}>
            <SHead>Patient Narrative</SHead>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Describe your symptoms in detail — duration, severity, location, and associated symptoms…"
              style={{ width: "100%", minHeight: 180, padding: 20, borderRadius: 14, border: `1.5px solid ${T.border}`, background: T.bgDeep, outline: "none", fontFamily: "inherit", fontSize: 15, resize: "vertical", lineHeight: 1.6 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: T.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>Gemini · Not medical advice</span>
              <button className="btn-primary" onClick={analyze} disabled={loading || !input.trim()} style={{ opacity: loading || !input.trim() ? 0.5 : 1 }}>
                {loading ? "Analyzing…" : "Run Clinical Triage →"}
              </button>
            </div>
          </Card>

          {triageResult && (
            <div style={{ animation: "fadeUp .4s ease" }}>
              {/* Emergency / Urgent banner */}
              {(isEmergency || isUrgent) && (
                <div style={{ marginBottom: 14, padding: "18px 22px", borderRadius: 16, background: isEmergency ? `${T.roseDeep}12` : `${T.amber}12`, border: `2px solid ${isEmergency ? T.roseDeep : T.amber}`, display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{isEmergency ? "🚨" : "⚠️"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 17, color: isEmergency ? T.roseDeep : T.amber, marginBottom: 6 }}>
                      {isEmergency ? "EMERGENCY — Seek immediate care" : "URGENT — See a doctor today"}
                    </div>
                    {resultText && (
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: T.inkMid, lineHeight: 1.65, marginBottom: isEmergency && nearestHospital ? 14 : 0 }}>
                        {resultText}
                      </div>
                    )}
                    {/* Nearest hospital card inside emergency banner */}
                    {isEmergency && nearestHospital && (
                      <div style={{ padding: "12px 16px", borderRadius: 12, background: `${T.roseDeep}10`, border: `1px solid ${T.roseDeep}30`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: T.roseDeep, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 3 }}>Nearest Hospital</div>
                          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, color: T.ink }}>{nearestHospital.name}</div>
                          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: T.inkFaint, marginTop: 2 }}>{nearestHospital.distance.toFixed(1)} km · {nearestHospital.address}</div>
                        </div>
                        <button
                          onClick={() => navigate("/hospital")}
                          style={{ padding: "10px 20px", borderRadius: 100, background: T.roseDeep, color: T.white, border: "none", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                        >
                          Get Directions →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Appointment booking confirmation */}
              {booking && (
                <div style={{ marginBottom: 14, padding: "16px 20px", borderRadius: 14, background: `${T.vital}10`, border: `1.5px solid ${T.vital}40`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: T.vital, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>Appointment Booked</div>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, color: T.ink }}>{booking.slot}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: T.inkFaint, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>Est. Wait Time</div>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, color: T.amber }}>{booking.waitTime}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: T.inkFaint, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>Procedure Time</div>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, color: T.rose }}>{booking.procedureTime}</div>
                  </div>
                </div>
              )}

              {/* Routine result card */}
              {!isEmergency && !isUrgent && resultText && (
                <Card>
                  <SHead>Assessment — {severity || "Routine"}</SHead>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: T.inkMid, lineHeight: 1.7 }}>{resultText}</div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Camera + vitals + nearest hospital */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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

          <Card accent={T.rose}>
            <SHead>Biometric Stream</SHead>
            <div style={{ display: "flex", flexDirection: "column", gap: 15, padding: "10px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 10, color: T.inkFaint }}>HEART RATE</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: T.rose, lineHeight: 1 }}>{vitals.pulse} <span style={{ fontSize: 12, fontWeight: 400 }}>BPM</span></div>
                </div>
                <Icons.heartbeat />
              </div>
              <div style={{ height: 1, background: T.border }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 10, color: T.inkFaint }}>RESPIRATION</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: T.vital, lineHeight: 1 }}>{vitals.breathing} <span style={{ fontSize: 12, fontWeight: 400 }}>RPM</span></div>
                </div>
                <Icons.brain />
              </div>
            </div>
          </Card>

          {nearestHospital && (
            <Card>
              <SHead>Nearest Hospital</SHead>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 3 }}>{nearestHospital.name}</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: T.inkFaint, marginBottom: 12 }}>{nearestHospital.distance.toFixed(1)} km · {nearestHospital.address}</div>
              <button onClick={() => navigate("/hospital")} style={{ width: "100%", padding: "9px 0", borderRadius: 8, background: T.vital, color: T.white, border: "none", fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                View on Map →
              </button>
            </Card>
          )}

          <div style={{ fontSize: 10, color: T.inkFaint, textAlign: "center", fontStyle: "italic" }}>
            Vitals simulated locally · Real data polled every 15 s
          </div>
        </div>
      </div>
    </PageWrap>
  );
}
