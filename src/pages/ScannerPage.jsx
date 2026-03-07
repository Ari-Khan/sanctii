import { useState, useRef, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Icons } from "../theme";
import { Card } from "../components/SharedUI";

const FIELDS = [
  { key: "full_name", label: "Full Name", icon: "user", placeholder: "John Doe" },
  { key: "card_number", label: "Health Card Number", icon: "card", placeholder: "1234-567-890" },
  { key: "version_code", label: "Version Code", icon: "grid", placeholder: "AB" },
  { key: "date_of_birth", label: "Date of Birth", icon: "calendar", placeholder: "YYYY-MM-DD" },
  { key: "gender", label: "Gender", icon: "user", placeholder: "M / F" },
  { key: "province", label: "Province", icon: "mapPin", placeholder: "ON, BC, AB..." },
  { key: "expiry_date", label: "Expiry Date", icon: "calendar", placeholder: "YYYY-MM-DD" },
  { key: "issue_date", label: "Issue Date", icon: "calendar", placeholder: "YYYY-MM-DD" },
];

const emptyCard = () => FIELDS.reduce((o, f) => ({ ...o, [f.key]: "" }), { confidence: 0, notes: "" });

export default function ScannerPage({ PageWrap }) {
  const { user } = useAuth0();
  const [mode, setMode] = useState("choose"); // "choose" | "upload" | "camera" | "manual"
  const [imageSrc, setImageSrc] = useState(null);
  const [formData, setFormData] = useState(emptyCard());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const T = {
    bg: "#F8F0E8", bgDeep: "#F0E4D4", surfaceHard: "#FFFAF4",
    border: "rgba(200,160,140,0.3)", rose: "#D4706A", roseMid: "#C05858",
    roseDeep: "#A84040", roseTint: "rgba(212,112,106,0.08)",
    roseGlow: "rgba(212,112,106,0.35)", vital: "#5BAA8A",
    vitalPale: "rgba(91,170,138,0.15)", amber: "#D4974A",
    ink: "#2A1818", inkMid: "#6B4040", inkFaint: "#A08070", white: "#FFFCF8",
  };

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: `1.5px solid ${T.border}`, background: T.surfaceHard,
    fontFamily: "'Outfit',sans-serif", fontSize: 13, color: T.ink,
    outline: "none", transition: "border-color .2s",
  };

  // ── Load existing card on mount ──
  useEffect(() => {
    if (!user?.email) return;
    fetch(`http://localhost:3001/api/healthcard?email=${encodeURIComponent(user.email)}`)
      .then(r => { if (r.ok) return r.json(); throw new Error("none"); })
      .then(card => {
        const data = {};
        FIELDS.forEach(f => { data[f.key] = card[f.key] || ""; });
        data.confidence = card.confidence || 0;
        data.notes = card.notes || "";
        setFormData(data);
        setSaved(true);
      })
      .catch(() => { });
  }, [user?.email]);

  // ── Camera cleanup ──
  useEffect(() => { return () => stopCamera(); }, []);
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.error("Video play error:", err));
    }
  }, [cameraActive]);

  const startCamera = async () => {
    try {
      setError(null); setMode("camera"); setCameraActive(true);
      await new Promise(r => setTimeout(r, 100));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied. Please use file upload instead.");
      setCameraActive(false); setMode("choose");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  };

  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    const url = c.toDataURL("image/jpeg", 0.9);
    setImageSrc(url); stopCamera(); setMode("upload");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImageSrc(reader.result); setError(null); setMode("upload"); };
      reader.readAsDataURL(file);
    }
  };

  // ── Scan ──
  const scanCard = async () => {
    if (!imageSrc) return;
    setLoading(true); setError(null); setSaved(false);
    try {
      const res = await fetch("http://localhost:3001/api/healthcard/scan-base64", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Scan failed"); }
      const data = await res.json();
      const mapped = {};
      FIELDS.forEach(f => { mapped[f.key] = data[f.key] || ""; });
      mapped.confidence = data.confidence || 0;
      mapped.notes = data.notes || "";
      setFormData(mapped);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Save ──
  const saveCard = async (source) => {
    setSaving(true); setError(null);
    try {
      const body = { ...formData, email: user?.email, source };
      const res = await fetch("http://localhost:3001/api/healthcard/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Save failed"); }
      setSaved(true);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const reset = () => {
    stopCamera(); setImageSrc(null); setFormData(emptyCard());
    setError(null); setSaved(false); setMode("choose");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasData = FIELDS.some(f => formData[f.key]);

  return (
    <PageWrap title="Health Card Scanner" icon={<Icons.card />} subtitle="Optical Character Recognition">
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* ── Left Col: Input ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: T.inkFaint, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />Capture, Upload, or Enter<div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", padding: "20px 0" }}>

              {/* Choose mode */}
              {mode === "choose" && (
                <>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: T.roseTint, display: "flex", alignItems: "center", justifyContent: "center", color: T.rose }}>
                    <Icons.card />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 15, color: T.ink }}>Add your Health Card</div>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: T.inkFaint, marginTop: 4 }}>Scan with camera, upload an image, or enter details manually</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                    <button className="btn-primary" onClick={startCamera} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                      Camera
                    </button>
                    <button className="btn-ghost" onClick={() => fileInputRef.current?.click()}>Upload File</button>
                    <button className="btn-ghost" onClick={() => setMode("manual")} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      Enter Manually
                    </button>
                  </div>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                </>
              )}

              {/* Camera live */}
              {mode === "camera" && cameraActive && (
                <>
                  <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden", border: `2px solid ${T.rose}`, background: "#000" }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", display: "block", borderRadius: 10 }} />
                    <div style={{ position: "absolute", inset: "10%", border: `2px dashed ${T.rose}`, borderRadius: 12, pointerEvents: "none", opacity: 0.6 }} />
                    <div style={{ position: "absolute", top: "10%", left: 0, right: 0, height: 2, background: T.rose, opacity: 0.5, animation: "scanLine 2.5s ease-in-out infinite" }} />
                    <div style={{ position: "absolute", top: 10, left: 10, padding: "4px 10px", borderRadius: 6, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4444", animation: "pulse 1.2s ease infinite" }} />
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "#fff", letterSpacing: "0.12em", textTransform: "uppercase" }}>Live</span>
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: T.inkFaint, textAlign: "center" }}>Position your health card within the frame</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn-ghost" onClick={reset}>Cancel</button>
                    <button className="btn-primary" onClick={captureFromCamera} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" fill="currentColor" /></svg>
                      Capture
                    </button>
                  </div>
                </>
              )}

              {/* Image preview */}
              {mode === "upload" && imageSrc && (
                <>
                  <img src={imageSrc} alt="Preview" style={{ maxWidth: "100%", maxHeight: 250, borderRadius: 8, border: `1px solid ${T.border}` }} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn-ghost" onClick={reset} disabled={loading}>New Scan</button>
                    <button className="btn-primary" onClick={scanCard} disabled={loading}>
                      {loading ? "Scanning..." : "Scan"}
                    </button>
                  </div>
                </>
              )}

              {/* Manual entry */}
              {mode === "manual" && (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                  {FIELDS.map(f => {
                    const Ic = Icons[f.icon];
                    return (
                      <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ color: T.rose, flexShrink: 0, width: 20, display: "flex", justifyContent: "center" }}><Ic /></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: T.inkFaint, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>{f.label}</div>
                          <input
                            style={inputStyle}
                            placeholder={f.placeholder}
                            value={formData[f.key] || ""}
                            onChange={e => updateField(f.key, e.target.value)}
                            onFocus={e => { e.target.style.borderColor = T.rose; }}
                            onBlur={e => { e.target.style.borderColor = T.border; }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button className="btn-ghost" onClick={reset}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div style={{ padding: 12, borderRadius: 8, background: `${T.roseDeep}10`, border: `1px solid ${T.roseDeep}40`, color: T.roseDeep, fontFamily: "'Outfit',sans-serif", fontSize: 13, marginTop: 12 }}>
                {error}
              </div>
            )}
          </Card>
        </div>

        {/* ── Right Col: Data ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: T.inkFaint, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />Health Card Data<div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            {loading ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg,${T.rose},${T.roseDeep})`, display: "flex", alignItems: "center", justifyContent: "center", color: T.white, animation: "breathe 2s ease-in-out infinite", margin: "0 auto 16px" }}>
                  <Icons.brain />
                </div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink }}>Processing...</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.inkFaint, marginTop: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>Extracting patient details</div>
              </div>
            ) : hasData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Confidence */}
                {formData.confidence > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>Scan Confidence</span>
                    <div style={{ padding: "3px 9px", borderRadius: 6, background: formData.confidence > 0.7 ? `${T.vital}14` : `${T.amber}14`, fontFamily: "'DM Mono',monospace", fontSize: 10, color: formData.confidence > 0.7 ? T.vital : T.amber, letterSpacing: "0.05em" }}>
                      {Math.round(formData.confidence * 100)}%
                    </div>
                  </div>
                )}

                {/* Editable fields */}
                {FIELDS.map(f => {
                  const Ic = Icons[f.icon];
                  return (
                    <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ color: T.rose }}><Ic /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: T.inkFaint }}>{f.label}</div>
                        <input
                          style={{ ...inputStyle, border: "none", padding: "4px 0", background: "transparent", fontWeight: 600, fontSize: 14 }}
                          placeholder="Not detected"
                          value={formData[f.key] || ""}
                          onChange={e => updateField(f.key, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Save button */}
                <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
                  <button className="btn-primary" onClick={() => saveCard(mode === "manual" ? "manual" : "scan")} disabled={saving || saved} style={{ flex: 1 }}>
                    {saved ? "✓ Saved" : saving ? "Saving..." : "Save"}
                  </button>
                  <button className="btn-ghost" onClick={reset}>Reset</button>
                </div>

                {saved && (
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: T.vitalPale, border: `1px solid ${T.vital}35`, display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.vital }} />
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.vital, letterSpacing: "0.1em", textTransform: "uppercase" }}>Saved to database</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "40px 0", textAlign: "center", color: T.inkFaint, fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>
                Scanned or entered data will appear here.
              </div>
            )}
          </Card>
        </div>

      </div>
    </PageWrap>
  );
}
