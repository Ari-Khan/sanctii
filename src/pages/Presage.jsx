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

const POSTAL_COORDS = {
  "L9R": { lat: 44.0177, lng: -79.6404 }, "L4M": { lat: 44.3899, lng: -79.7561 },
  "L6R": { lat: 43.7315, lng: -79.7624 }, "M9V": { lat: 43.7315, lng: -79.5394 },
  "L6W": { lat: 43.7117, lng: -79.7528 }, "M9N": { lat: 43.6850, lng: -79.5150 },
  "L9Y": { lat: 44.4553, lng: -80.2331 }, "P1H": { lat: 45.3342, lng: -79.2136 },
  "P1L": { lat: 45.1317, lng: -79.3161 }, "L3P": { lat: 43.8500, lng: -79.2469 },
  "L9P": { lat: 43.8561, lng: -79.1292 }, "L4R": { lat: 44.7653, lng: -79.2903 },
  "L5M": { lat: 43.5633, lng: -79.5950 }, "L5B": { lat: 43.5850, lng: -79.6444 },
  "M9C": { lat: 43.5267, lng: -79.5539 }, "L5K": { lat: 43.5983, lng: -79.6428 },
  "M6M": { lat: 43.7136, lng: -79.4619 }, "L3Y": { lat: 44.0497, lng: -79.4606 },
  "L6M": { lat: 43.4671, lng: -79.2742 }, "L9T": { lat: 43.5236, lng: -79.8728 },
  "L7G": { lat: 43.6532, lng: -79.9167 }, "L9W": { lat: 43.9192, lng: -80.0967 },
  "L3V": { lat: 44.6087, lng: -79.4207 }, "L9M": { lat: 44.7667, lng: -79.9333 },
  "L4C": { lat: 43.8828, lng: -79.4403 }, "M3M": { lat: 43.7333, lng: -79.5000 },
  "M2K": { lat: 43.7667, lng: -79.3833 }, "M5B": { lat: 43.6533, lng: -79.3767 },
  "M6R": { lat: 43.6450, lng: -79.4433 }, "M5G": { lat: 43.6567, lng: -79.3900 },
  "M4N": { lat: 43.7233, lng: -79.3833 }, "M6J": { lat: 43.6417, lng: -79.4267 },
  "M1P": { lat: 43.7567, lng: -79.2567 }, "L7R": { lat: 43.3267, lng: -79.8050 },
  "N1R": { lat: 43.3833, lng: -80.3167 }, "N1E": { lat: 43.5500, lng: -80.2500 },
  "L8L": { lat: 43.2633, lng: -79.8567 }, "L8V": { lat: 43.2317, lng: -79.8517 },
  "L8N": { lat: 43.2567, lng: -79.9000 }, "N2A": { lat: 43.4333, lng: -80.4167 },
  "N2G": { lat: 43.4500, lng: -80.5167 }, "N2M": { lat: 43.4417, lng: -80.4833 },
  "N6A": { lat: 42.9833, lng: -81.2500 }, "N4K": { lat: 44.5667, lng: -80.9333 },
  "N7T": { lat: 42.9833, lng: -82.4000 }, "N3Y": { lat: 42.8333, lng: -80.3000 },
  "L2S": { lat: 43.1500, lng: -79.2167 }, "L2E": { lat: 43.1000, lng: -79.0667 },
  "N5R": { lat: 42.7750, lng: -81.1667 }, "N5A": { lat: 43.3667, lng: -81.0000 },
  "N4S": { lat: 43.1167, lng: -80.7500 }, "K6V": { lat: 44.5833, lng: -75.6833 },
  "K7C": { lat: 45.0667, lng: -76.1167 }, "K9A": { lat: 43.9667, lng: -78.1667 },
  "K6H": { lat: 45.0167, lng: -74.7333 }, "K0J": { lat: 46.1000, lng: -77.5000 },
  "K6A": { lat: 45.6000, lng: -74.5833 }, "K0G": { lat: 44.9833, lng: -75.6333 },
  "K7L": { lat: 44.2333, lng: -76.5000 }, "K9V": { lat: 44.3500, lng: -78.7333 },
  "K7R": { lat: 44.2333, lng: -76.9500 }, "L1G": { lat: 43.8833, lng: -78.8333 },
  "L1C": { lat: 43.9167, lng: -78.6833 }, "L1S": { lat: 43.8500, lng: -79.0167 },
  "L9L": { lat: 44.1000, lng: -78.9500 }, "L1N": { lat: 43.8667, lng: -78.9333 },
  "K2H": { lat: 45.3500, lng: -75.8167 }, "K1Y": { lat: 45.4000, lng: -75.7333 },
  "K1K": { lat: 45.4333, lng: -75.6500 }, "K1H": { lat: 45.3833, lng: -75.6667 },
  "K9J": { lat: 44.3000, lng: -78.3167 }, "P7B": { lat: 48.3833, lng: -89.2333 },
  "K0A": { lat: 45.2167, lng: -76.2000 }, "K7S": { lat: 45.4167, lng: -76.3500 },
  "K0C": { lat: 45.3167, lng: -74.6333 }, "K8N": { lat: 44.1667, lng: -77.3833 },
  "K0K": { lat: 44.0000, lng: -77.1333 }, "K8V": { lat: 44.1167, lng: -77.5833 },
};

function getCoordsFromAddress(address) {
  const m = address.match(/([A-Z]\d[A-Z])\s?\d[A-Z]\d/i);
  if (m) return POSTAL_COORDS[m[1].toUpperCase()] || null;
  return null;
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
          const ci = line.indexOf(",");
          return { name: line.slice(0, ci).trim(), address: line.slice(ci + 1).trim() };
        });
        let nearest = null, minDist = Infinity;
        hospitals.forEach(h => {
          const c = getCoordsFromAddress(h.address);
          if (!c) return;
          const d = haversine(loc.lat, loc.lng, c.lat, c.lng);
          if (d < minDist) { minDist = d; nearest = { ...h, distance: d, coords: c }; }
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
