import { useState, useRef, useEffect } from "react";
import { Icons } from "../theme";
import { Card } from "../components/SharedUI";

export default function ScannerPage({ PageWrap }) {
  const [mode, setMode] = useState("choose"); // "choose" | "upload" | "camera"
  const [imageSrc, setImageSrc] = useState(null);
  const [apiResult, setApiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const T = {
    bg: "#F8F0E8",
    bgDeep: "#F0E4D4",
    surfaceHard: "#FFFAF4",
    border: "rgba(200,160,140,0.3)",
    rose: "#D4706A",
    roseMid: "#C05858",
    roseDeep: "#A84040",
    roseTint: "rgba(212,112,106,0.08)",
    roseGlow: "rgba(212,112,106,0.35)",
    vital: "#5BAA8A",
    vitalPale: "rgba(91,170,138,0.15)",
    amber: "#D4974A",
    ink: "#2A1818",
    inkMid: "#6B4040",
    inkFaint: "#A08070",
    white: "#FFFCF8",
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Attach stream when video element renders
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.error("Video play error:", err));
    }
  }, [cameraActive]);

  // ── Camera ──
  const startCamera = async () => {
    try {
      setError(null);
      setMode("camera");
      setCameraActive(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied. Please use file upload instead.");
      setCameraActive(false);
      setMode("choose");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setImageSrc(imageDataUrl);
    stopCamera();
    setMode("upload");
  };

  // ── File upload ──
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result);
        setError(null);
        setApiResult(null);
        setMode("upload");
      };
      reader.readAsDataURL(file);
    }
  };

  // ── Scan ──
  const scanCard = async () => {
    if (!imageSrc) return;
    setLoading(true);
    setError(null);
    setApiResult(null);

    try {
      const response = await fetch("http://localhost:3001/api/healthcard/scan-base64", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc }),
      });

      if (!response.ok) {
        let msg = "Scan failed";
        try { const errData = await response.json(); msg = errData.detail || msg; } catch(e) {}
        throw new Error(msg);
      }

      const data = await response.json();
      setApiResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to scan card");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    stopCamera();
    setImageSrc(null);
    setApiResult(null);
    setError(null);
    setMode("choose");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // hidden canvas for capture
  const hiddenCanvas = <canvas ref={canvasRef} style={{ display: "none" }} />;

  return (
    <PageWrap title="Health Card Scanner" icon={<Icons.card />} subtitle="Optical Character Recognition">
      {hiddenCanvas}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* ── Left Col: Input ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:"0.18em", textTransform:"uppercase", color:T.inkFaint, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, height:1, background:T.border }}/>Capture or Upload<div style={{ flex:1, height:1, background:T.border }}/>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:16, alignItems:"center", padding: "20px 0" }}>

              {/* ── Choose mode ── */}
              {mode === "choose" && (
                <>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: T.roseTint, display: "flex", alignItems: "center", justifyContent: "center", color: T.rose }}>
                    <Icons.card/>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:15, color:T.ink }}>Scan your Health Card</div>
                    <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.inkFaint, marginTop:4 }}>Take a photo with your camera or upload an image file</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn-primary" onClick={startCamera} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      Use Camera
                    </button>
                    <button className="btn-ghost" onClick={() => fileInputRef.current?.click()}>
                      Upload File
                    </button>
                  </div>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                </>
              )}

              {/* ── Camera live view ── */}
              {mode === "camera" && cameraActive && (
                <>
                  <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden", border: `2px solid ${T.rose}`, background: "#000" }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", display: "block", borderRadius: 10 }} />

                    {/* Scan overlay frame */}
                    <div style={{ position: "absolute", inset: "10%", border: `2px dashed ${T.rose}`, borderRadius: 12, pointerEvents: "none", opacity: 0.6 }} />
                    <div style={{ position: "absolute", top: "10%", left: 0, right: 0, height: 2, background: T.rose, opacity: 0.5, animation: "scanLine 2.5s ease-in-out infinite" }} />

                    {/* HUD badge */}
                    <div style={{ position: "absolute", top: 10, left: 10, padding: "4px 10px", borderRadius: 6, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4444", animation: "pulse 1.2s ease infinite" }} />
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize: 8, color: "#fff", letterSpacing: "0.12em", textTransform: "uppercase" }}>Live</span>
                    </div>
                  </div>

                  <div style={{ fontFamily:"'Outfit',sans-serif", fontSize: 12, color: T.inkFaint, textAlign: "center", marginTop: -4 }}>
                    Position your health card within the frame
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn-ghost" onClick={reset}>Cancel</button>
                    <button className="btn-primary" onClick={captureFromCamera} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>
                      Capture
                    </button>
                  </div>
                </>
              )}

              {/* ── Image preview (from file or camera capture) ── */}
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
            </div>

            {error && (
              <div style={{ padding: 12, borderRadius: 8, background: `${T.roseDeep}10`, border: `1px solid ${T.roseDeep}40`, color: T.roseDeep, fontFamily:"'Outfit',sans-serif", fontSize: 13, marginTop: 12 }}>
                {error}
              </div>
            )}
          </Card>
        </div>

        {/* ── Right Col: Extracted Results ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, letterSpacing:"0.18em", textTransform:"uppercase", color:T.inkFaint, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, height:1, background:T.border }}/>Extracted Data<div style={{ flex:1, height:1, background:T.border }}/>
            </div>

            {loading ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div style={{ width:38, height:38, borderRadius:11, background:`linear-gradient(135deg,${T.rose},${T.roseDeep})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, animation:"breathe 2s ease-in-out infinite", margin: "0 auto 16px" }}>
                  <Icons.brain/>
                </div>
                <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:14, color:T.ink }}>Processing...</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.inkFaint, marginTop:4, letterSpacing: "0.1em", textTransform: "uppercase" }}>Extracting patient details</div>
              </div>
            ) : apiResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Confidence Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.inkFaint, letterSpacing:"0.1em", textTransform:"uppercase" }}>Scan Confidence</span>
                  <div style={{ padding:"3px 9px", borderRadius:6, background:apiResult.confidence>0.7?`${T.vital}14`:`${T.amber}14`, fontFamily:"'DM Mono',monospace", fontSize:10, color:apiResult.confidence>0.7?T.vital:T.amber, letterSpacing:"0.05em" }}>
                    {Math.round(apiResult.confidence * 100)}%
                  </div>
                </div>

                {/* Data Fields */}
                {[
                  ["Full Name", apiResult.full_name, <Icons.user/>],
                  ["Health Card Number", apiResult.card_number, <Icons.card/>],
                  ["Version", apiResult.version_code, <Icons.grid/>],
                  ["Date of Birth", apiResult.date_of_birth, <Icons.calendar/>],
                  ["Gender", apiResult.gender, <Icons.user/>],
                  ["Province", apiResult.province, <Icons.mapPin/>],
                ].map(([label, val, icon]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ color: T.rose }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:11, color:T.inkFaint }}>{label}</div>
                      <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:14, color: val ? T.ink : T.inkFaint }}>
                        {val || "Not detected"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px 0", textAlign: "center", color: T.inkFaint, fontFamily:"'Outfit',sans-serif", fontSize: 13 }}>
                Scanned data will appear here.
              </div>
            )}
          </Card>
        </div>

      </div>
    </PageWrap>
  );
}
