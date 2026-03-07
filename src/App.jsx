import { useState, useEffect, useRef, useCallback } from "react";

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  cream: "#FDF6EE",
  creamDark: "#F5EAD8",
  creamBorder: "#E8D5BC",
  red: "#E8A0A0",
  redDeep: "#D4707080",
  redAccent: "#C85A5A",
  redGlow: "#E8A0A080",
  redText: "#B84040",
  muted: "#9A7B6A",
  dark: "#3D2020",
  white: "#FFFAF5",
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Mono:wght@300;400;500&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: ${T.cream};
      font-family: 'Cormorant Garamond', Georgia, serif;
      color: ${T.dark};
      overflow-x: hidden;
    }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${T.creamDark}; }
    ::-webkit-scrollbar-thumb { background: ${T.red}; border-radius: 3px; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseRed {
      0%, 100% { box-shadow: 0 0 0 0 ${T.redGlow}; }
      50% { box-shadow: 0 0 0 12px transparent; }
    }
    @keyframes scanLine {
      0% { top: 10%; }
      50% { top: 88%; }
      100% { top: 10%; }
    }
    @keyframes pathDraw {
      from { stroke-dashoffset: 1000; }
      to { stroke-dashoffset: 0; }
    }
    @keyframes nodeAppear {
      from { opacity: 0; transform: scale(0.4); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    @keyframes grain {
      0%, 100% { transform: translate(0,0); }
      10% { transform: translate(-2%,-3%); }
      20% { transform: translate(3%,2%); }
      30% { transform: translate(-1%,4%); }
      40% { transform: translate(4%,-1%); }
      50% { transform: translate(-3%,3%); }
      60% { transform: translate(2%,-4%); }
      70% { transform: translate(-4%,1%); }
      80% { transform: translate(3%,-2%); }
      90% { transform: translate(-2%,4%); }
    }

    .sanctii-btn {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 10px 24px;
      border-radius: 2px;
      border: 1px solid ${T.redAccent};
      background: transparent;
      color: ${T.redAccent};
      cursor: pointer;
      transition: all 0.25s ease;
    }
    .sanctii-btn:hover {
      background: ${T.redAccent};
      color: ${T.white};
      box-shadow: 0 4px 20px ${T.redGlow};
    }
    .sanctii-btn-fill {
      background: ${T.redAccent};
      color: ${T.white};
    }
    .sanctii-btn-fill:hover {
      background: ${T.redText};
      box-shadow: 0 6px 24px ${T.redGlow};
    }

    .fade-in { animation: fadeIn 0.6s ease forwards; }

    .grain-overlay {
      position: fixed;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
      pointer-events: none;
      z-index: 9999;
      opacity: 0.35;
      animation: grain 0.5s steps(1) infinite;
    }
  `}</style>
);

// ─── MAZE CONFIGURATION ───────────────────────────────────────────────────────
const MAZE_NODES = {
  center:    { x: 50,  y: 50,  label: "SANCTII",     icon: "✦",  isCenter: true },
  patient:   { x: 50,  y: 18,  label: "Patient Portal", icon: "◎", page: "patient" },
  doctor:    { x: 82,  y: 35,  label: "Doctor Portal",  icon: "⊕", page: "doctor" },
  rooms:     { x: 82,  y: 65,  label: "Room Map",       icon: "⊞", page: "rooms" },
  hospital:  { x: 50,  y: 82,  label: "Find Hospital",  icon: "⊘", page: "hospital" },
  presage:   { x: 18,  y: 65,  label: "Presage AI",     icon: "◈", page: "presage" },
  schedule:  { x: 18,  y: 35,  label: "Schedule",       icon: "◷", page: "schedule" },
};

const MAZE_PATHS = [
  { from: "center", to: "patient",  waypoints: [] },
  { from: "center", to: "doctor",   waypoints: [] },
  { from: "center", to: "rooms",    waypoints: [] },
  { from: "center", to: "hospital", waypoints: [] },
  { from: "center", to: "presage",  waypoints: [] },
  { from: "center", to: "schedule", waypoints: [] },
  { from: "patient",  to: "schedule", waypoints: [{ x: 18, y: 18 }] },
  { from: "doctor",   to: "rooms",    waypoints: [{ x: 95, y: 50 }] },
  { from: "hospital", to: "presage",  waypoints: [{ x: 30, y: 90 }] },
  { from: "schedule", to: "presage",  waypoints: [{ x: 5,  y: 50 }] },
  { from: "patient",  to: "doctor",   waypoints: [{ x: 70, y: 10 }] },
  { from: "rooms",    to: "hospital", waypoints: [{ x: 90, y: 80 }] },
  // decoy maze walls (non-interactive)
  { from: null, to: null, decorative: true, d: "M 20 5 L 20 25 L 40 25" },
  { from: null, to: null, decorative: true, d: "M 60 5 L 80 5 L 80 20" },
  { from: null, to: null, decorative: true, d: "M 95 45 L 95 55" },
  { from: null, to: null, decorative: true, d: "M 80 80 L 95 80 L 95 95" },
  { from: null, to: null, decorative: true, d: "M 5 60 L 5 90 L 20 90" },
  { from: null, to: null, decorative: true, d: "M 5 10 L 5 30 L 15 30 L 15 45" },
  { from: null, to: null, decorative: true, d: "M 35 90 L 35 95 L 65 95 L 65 90" },
  { from: null, to: null, decorative: true, d: "M 55 10 L 55 5 L 45 5 L 45 15" },
  { from: null, to: null, decorative: true, d: "M 88 30 L 98 30 L 98 20 L 88 20" },
];

// BFS optimal path finder
function findPath(fromKey, toKey) {
  const edges = {};
  Object.keys(MAZE_NODES).forEach(k => { edges[k] = []; });
  MAZE_PATHS.filter(p => p.from && p.to).forEach(p => {
    edges[p.from].push(p.to);
    edges[p.to].push(p.from);
  });
  const visited = { [fromKey]: true };
  const queue = [[fromKey]];
  while (queue.length) {
    const path = queue.shift();
    const node = path[path.length - 1];
    if (node === toKey) return path;
    (edges[node] || []).forEach(nb => {
      if (!visited[nb]) { visited[nb] = true; queue.push([...path, nb]); }
    });
  }
  return [fromKey, toKey];
}

function pathToSVG(pathKeys) {
  if (pathKeys.length < 2) return "";
  let d = "";
  pathKeys.forEach((key, i) => {
    const n = MAZE_NODES[key];
    const edge = MAZE_PATHS.find(p =>
      !p.decorative && (
        (p.from === pathKeys[i-1] && p.to === key) ||
        (p.to === pathKeys[i-1] && p.from === key)
      )
    );
    if (i === 0) {
      d += `M ${n.x} ${n.y}`;
    } else if (edge && edge.waypoints && edge.waypoints.length) {
      edge.waypoints.forEach(wp => { d += ` L ${wp.x} ${wp.y}`; });
      d += ` L ${n.x} ${n.y}`;
    } else {
      d += ` L ${n.x} ${n.y}`;
    }
  });
  return d;
}

// ─── MAZE COMPONENT ──────────────────────────────────────────────────────────
function MazeUI({ onNavigate }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [optimalPath, setOptimalPath] = useState([]);
  const [clickedNode, setClickedNode] = useState(null);

  useEffect(() => {
    if (hoveredNode && hoveredNode !== "center") {
      setOptimalPath(findPath("center", hoveredNode));
    } else {
      setOptimalPath([]);
    }
  }, [hoveredNode]);

  const pathD = pathToSVG(optimalPath);

  return (
    <div style={{
      width: "100%", height: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse at 50% 50%, ${T.creamDark} 0%, ${T.cream} 70%)`,
      position: "relative", overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{ position: "absolute", top: 32, left: 40, zIndex: 10 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontStyle: "italic", color: T.muted, letterSpacing: "0.1em" }}>
          medical intelligence platform
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 300, color: T.redText, letterSpacing: "0.05em", display: 'flex', alignItems: 'center' }}>
          Sanctii
          <img src="/heart.svg" alt="heart icon" style={{ width: 24, height: 24, marginLeft: 8 }} />
        </div>
      </div>

      {/* Top right auth */}
      <div style={{ position: "absolute", top: 32, right: 40, display: "flex", gap: 12, zIndex: 10 }}>
        <button className="sanctii-btn" onClick={() => onNavigate("login")}>Sign In</button>
        <button className="sanctii-btn sanctii-btn-fill" onClick={() => onNavigate("login")}>Register</button>
      </div>

      {/* Maze SVG */}
      <div style={{ position: "relative", width: "min(85vw, 85vh)", height: "min(85vw, 85vh)", maxWidth: 680, maxHeight: 680 }}>
        <svg
          viewBox="0 0 100 100"
          style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <marker id="arrowRed" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
              <path d="M0,0 L0,4 L4,2 z" fill={T.redAccent} />
            </marker>
          </defs>

          {/* Decorative maze walls */}
          {MAZE_PATHS.filter(p => p.decorative).map((p, i) => (
            <path key={i} d={p.d} fill="none" stroke={T.creamBorder} strokeWidth="0.6" strokeLinecap="round" />
          ))}

          {/* All connection lines (dim) */}
          {MAZE_PATHS.filter(p => p.from && p.to).map((p, i) => {
            const from = MAZE_NODES[p.from];
            const to = MAZE_NODES[p.to];
            let d = `M ${from.x} ${from.y}`;
            if (p.waypoints) p.waypoints.forEach(wp => { d += ` L ${wp.x} ${wp.y}`; });
            d += ` L ${to.x} ${to.y}`;
            return (
              <path key={i} d={d} fill="none"
                stroke={T.creamBorder} strokeWidth="0.5"
                strokeDasharray="2 2" opacity="0.7"
              />
            );
          })}

          {/* Optimal path highlight */}
          {pathD && (
            <path
              d={pathD} fill="none"
              stroke={T.redAccent} strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round"
              markerEnd="url(#arrowRed)"
              filter="url(#glow)"
              strokeDasharray="1000"
              strokeDashoffset="0"
              style={{ animation: "pathDraw 0.5s ease forwards" }}
            />
          )}

          {/* Path node highlights */}
          {optimalPath.map((key, i) => {
            const n = MAZE_NODES[key];
            return (
              <circle key={key} cx={n.x} cy={n.y} r={i === 0 ? 2.8 : 2}
                fill={i === 0 ? T.redAccent : T.red}
                opacity={0.6}
                style={{ animation: `nodeAppear 0.3s ease ${i * 0.08}s both` }}
              />
            );
          })}
        </svg>

        {/* HTML Node Buttons */}
        {Object.entries(MAZE_NODES).map(([key, node]) => {
          const isActive = hoveredNode === key;
          const inPath = optimalPath.includes(key);
          const isCenter = node.isCenter;

          return (
            <div
              key={key}
              onMouseEnter={() => !isCenter && setHoveredNode(key)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => { if (!isCenter && node.page) { setClickedNode(key); setTimeout(() => onNavigate(node.page), 300); } }}
              style={{
                position: "absolute",
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 20,
                cursor: isCenter ? "default" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                animation: isCenter ? "float 4s ease-in-out infinite" : "none",
              }}>
                <div style={{
                  width: isCenter ? 72 : 48,
                  height: isCenter ? 72 : 48,
                  borderRadius: isCenter ? "50%" : "4px",
                  background: isActive || inPath
                    ? `linear-gradient(135deg, ${T.redAccent}, ${T.redText})`
                    : isCenter
                      ? `linear-gradient(135deg, ${T.red}, ${T.redAccent})`
                      : T.white,
                  border: `${isActive ? 2 : 1}px solid ${isActive || inPath ? T.redAccent : T.creamBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: isCenter ? 24 : 16,
                  color: isActive || inPath || isCenter ? T.white : T.muted,
                  boxShadow: isActive
                    ? `0 0 24px ${T.redGlow}, 0 4px 16px rgba(0,0,0,0.1)`
                    : inPath
                      ? `0 0 12px ${T.redGlow}`
                      : "0 2px 8px rgba(61,32,32,0.08)",
                  transition: "all 0.25s ease",
                  transform: isActive ? "scale(1.15)" : "scale(1)",
                  animation: isActive ? "pulseRed 1.5s ease infinite" : "none",
                }}>
                  {node.icon}
                </div>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: isCenter ? 12 : 9,
                  fontWeight: isCenter ? 500 : 400,
                  letterSpacing: "0.1em",
                  color: isActive || inPath ? T.redAccent : isCenter ? T.redText : T.muted,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  transition: "color 0.2s ease",
                  textTransform: "uppercase",
                }}>
                  {node.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom hint */}
      <div style={{
        position: "absolute", bottom: 28,
        fontFamily: "'DM Mono', monospace", fontSize: 10,
        color: T.muted, letterSpacing: "0.15em", textTransform: "uppercase",
        opacity: hoveredNode ? 0 : 0.7, transition: "opacity 0.3s ease",
      }}>
        hover a destination to reveal the optimal path
      </div>

      {hoveredNode && hoveredNode !== "center" && (
        <div style={{
          position: "absolute", bottom: 28,
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: T.redAccent, letterSpacing: "0.12em", textTransform: "uppercase",
          animation: "fadeIn 0.2s ease",
        }}>
          path to {MAZE_NODES[hoveredNode]?.label} — {optimalPath.length - 1} hop{optimalPath.length !== 2 ? "s" : ""} → click to enter
        </div>
      )}
    </div>
  );
}

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
function LoginPage({ onBack, onLogin }) {
  const [mode, setMode] = useState("card"); // card | manual
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const fileRef = useRef();

  const simulateScan = () => {
    setScanning(true);
    setScanned(false);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
      setScanData({
        name: "Jordan A. Mitchell",
        dob: "1989-03-14",
        healthCardNo: "HC-4821-0039-JM",
        province: "Ontario",
        expiry: "2027-01-01",
      });
    }, 2800);
  };

  const handleFileUpload = (e) => {
    if (e.target.files[0]) simulateScan();
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: `radial-gradient(ellipse at 30% 50%, #F9EDE3 0%, ${T.cream} 60%)`,
    }}>
      {/* Left panel */}
      <div style={{
        width: "42%", background: `linear-gradient(160deg, ${T.redAccent} 0%, ${T.redText} 100%)`,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: 48, position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 300, height: 300, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }}/>
        <div style={{
          position: "absolute", bottom: -60, left: -60,
          width: 240, height: 240, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }}/>
        <button
          onClick={onBack}
          style={{ position: "absolute", top: 24, left: 24, background: "none", border: "none",
            cursor: "pointer", color: "rgba(255,255,255,0.7)", fontFamily: "'DM Mono', monospace",
            fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}
        >
          ← back
        </button>
        <div style={{ textAlign: "center", zIndex: 1 }}>
          <div style={{ fontSize: 56, marginBottom: 8, animation: "float 3s ease-in-out infinite" }}>✦</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 300, color: T.white, letterSpacing: "0.05em" }}>
            Sanctii
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "rgba(255,255,255,0.75)", marginTop: 8 }}>
            medical intelligence platform
          </div>
          <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
            {["Instant health card verification", "Secure Auth0 authentication", "Smart patient routing", "Real-time hospital data"].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, animation: `fadeIn 0.5s ease ${0.2 + i * 0.1}s both` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.8)" }}/>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.8)", letterSpacing: "0.08em" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", padding: "48px 56px",
      }}>
        <div style={{ width: "100%", maxWidth: 420, animation: "fadeIn 0.6s ease" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 300, color: T.dark, marginBottom: 4 }}>
            Welcome back
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: T.muted, fontSize: 16, marginBottom: 32 }}>
            Sign in to your Sanctii account
          </div>

          {/* Role toggle */}
          <div style={{ display: "flex", gap: 0, marginBottom: 28, borderRadius: 4, overflow: "hidden", border: `1px solid ${T.creamBorder}` }}>
            {["patient", "doctor", "admin"].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                flex: 1, padding: "8px 0", border: "none", cursor: "pointer",
                fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                background: role === r ? T.redAccent : T.white,
                color: role === r ? T.white : T.muted,
                transition: "all 0.2s ease",
              }}>{r}</button>
            ))}
          </div>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {[["card", "◎ Health Card"], ["manual", "✎ Manual"]].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "9px 0",
                fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
                textTransform: "uppercase", cursor: "pointer", borderRadius: 2,
                border: `1px solid ${mode === m ? T.redAccent : T.creamBorder}`,
                background: mode === m ? `${T.redAccent}15` : "transparent",
                color: mode === m ? T.redAccent : T.muted,
                transition: "all 0.2s ease",
              }}>{label}</button>
            ))}
          </div>

          {/* ── HEALTH CARD MODE ── */}
          {mode === "card" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div
                onClick={() => !scanning && fileRef.current.click()}
                style={{
                  border: `2px dashed ${scanned ? T.redAccent : scanning ? T.red : T.creamBorder}`,
                  borderRadius: 8, padding: 32, textAlign: "center", cursor: "pointer",
                  background: scanned ? `${T.redAccent}08` : T.white,
                  transition: "all 0.3s ease", position: "relative", overflow: "hidden",
                  minHeight: 180,
                }}
              >
                {/* Scan line animation */}
                {scanning && (
                  <div style={{
                    position: "absolute", left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, transparent, ${T.redAccent}, transparent)`,
                    animation: "scanLine 1.2s ease-in-out infinite",
                  }}/>
                )}

                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />

                {!scanning && !scanned && (
                  <>
                    <div style={{ fontSize: 36, marginBottom: 12, color: T.red }}>⊡</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: T.dark, marginBottom: 8 }}>
                      Scan your Health Card
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: "0.1em" }}>
                      UPLOAD PHOTO OR USE CAMERA
                    </div>
                    <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "center" }}>
                      <button className="sanctii-btn" onClick={(e) => { e.stopPropagation(); simulateScan(); }}>
                        Simulate Scan
                      </button>
                    </div>
                  </>
                )}

                {scanning && (
                  <div style={{ padding: "20px 0" }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.redAccent, letterSpacing: "0.15em", marginBottom: 8 }}>
                      SCANNING CARD...
                    </div>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: T.red, animation: `pulseRed 1s ease ${i * 0.2}s infinite`,
                        }}/>
                      ))}
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 14, color: T.muted, marginTop: 12 }}>
                      Processing health card data via OCR...
                    </div>
                  </div>
                )}

                {scanned && scanData && (
                  <div style={{ animation: "fadeIn 0.4s ease", textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6BBF59" }}/>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#4A8A3A", letterSpacing: "0.1em" }}>
                        CARD VERIFIED
                      </span>
                    </div>
                    {Object.entries({
                      "Name": scanData.name,
                      "DOB": scanData.dob,
                      "Card No.": scanData.healthCardNo,
                      "Province": scanData.province,
                      "Expiry": scanData.expiry,
                    }).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, borderBottom: `1px solid ${T.creamBorder}`, paddingBottom: 4 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{k}</span>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: T.dark, fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {scanned && (
                <button
                  className="sanctii-btn sanctii-btn-fill"
                  onClick={() => onLogin(role)}
                  style={{ width: "100%", marginTop: 16, padding: "13px 0", fontSize: 12 }}
                >
                  Continue with Health Card →
                </button>
              )}
            </div>
          )}

          {/* ── MANUAL MODE ── */}
          {mode === "manual" && (
            <div style={{ animation: "fadeIn 0.3s ease", display: "flex", flexDirection: "column", gap: 16 }}>
              {[["Email address", "email", email, setEmail], ["Password", "password", password, setPassword]].map(([label, type, val, setter]) => (
                <div key={label}>
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, display: "block", marginBottom: 6 }}>
                    {label}
                  </label>
                  <input
                    type={type} value={val} onChange={e => setter(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px",
                      border: `1px solid ${T.creamBorder}`, borderRadius: 2,
                      fontFamily: "'Cormorant Garamond', serif", fontSize: 16,
                      background: T.white, color: T.dark, outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={e => { e.target.style.borderColor = T.redAccent; }}
                    onBlur={e => { e.target.style.borderColor = T.creamBorder; }}
                  />
                </div>
              ))}
              <button
                className="sanctii-btn sanctii-btn-fill"
                onClick={() => onLogin(role)}
                style={{ width: "100%", padding: "13px 0", fontSize: 12, marginTop: 8 }}
              >
                Sign In →
              </button>
              <div style={{ textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                or continue with
              </div>
              <button
                onClick={() => onLogin(role)}
                style={{
                  width: "100%", padding: "11px 0",
                  border: `1px solid ${T.creamBorder}`, borderRadius: 2,
                  background: T.white, cursor: "pointer",
                  fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
                  color: T.dark, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.redAccent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.creamBorder; }}
              >
                <span style={{ fontSize: 14 }}>A</span> Continue with Auth0
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PORTAL PAGES ─────────────────────────────────────────────────────────────
function PageShell({ title, icon, subtitle, children, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse at 60% 20%, ${T.creamDark} 0%, ${T.cream} 60%)` }}>
      <div style={{ borderBottom: `1px solid ${T.creamBorder}`, background: T.white, padding: "16px 40px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: `1px solid ${T.creamBorder}`, cursor: "pointer", padding: "6px 16px", borderRadius: 2, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: T.muted, textTransform: "uppercase" }}>← maze</button>
        <div style={{ fontSize: 22, color: T.redAccent }}>{icon}</div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 300, color: T.dark }}>{title}</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: T.muted }}>{subtitle}</div>
        </div>
        <div style={{ marginLeft: "auto", fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: "0.1em" }}>SANCTII PLATFORM</div>
      </div>
      <div style={{ padding: 40, animation: "fadeIn 0.5s ease" }}>{children}</div>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: T.white, border: `1px solid ${T.creamBorder}`,
      borderRadius: 4, padding: 24, boxShadow: "0 2px 12px rgba(61,32,32,0.05)",
      ...style
    }}>{children}</div>
  );
}

function StatBadge({ label, value, accent }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 24px", background: accent ? `${T.redAccent}10` : T.white, border: `1px solid ${accent ? T.redAccent : T.creamBorder}`, borderRadius: 4 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 300, color: accent ? T.redAccent : T.dark }}>{value}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function PatientPortal({ onBack }) {
  const [tab, setTab] = useState("overview");
  return (
    <PageShell title="Patient Portal" icon="◎" subtitle="Your health dashboard" onBack={onBack}>
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {["overview", "records", "prescriptions", "messages"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "8px 18px", border: `1px solid ${tab === t ? T.redAccent : T.creamBorder}`, borderRadius: 2, cursor: "pointer",
            background: tab === t ? T.redAccent : "transparent", color: tab === t ? T.white : T.muted,
            transition: "all 0.2s ease",
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatBadge label="Next Appointment" value="Mar 12" accent />
        <StatBadge label="Active Prescriptions" value="3" />
        <StatBadge label="Last Visit" value="Feb 18" />
        <StatBadge label="Health Score" value="87" accent />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <Card>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 16 }}>Recent Activity</div>
          {[
            { date: "Feb 18", event: "General Checkup — Dr. Sharma", status: "completed" },
            { date: "Feb 02", event: "Blood Work Results Received", status: "info" },
            { date: "Jan 29", event: "Prescription Renewed", status: "completed" },
            { date: "Jan 15", event: "X-Ray — Radiology Dept.", status: "completed" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.creamBorder}` }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.muted, minWidth: 48 }}>{item.date}</div>
              <div style={{ flex: 1, fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: T.dark }}>{item.event}</div>
              <div style={{ padding: "2px 10px", borderRadius: 10, background: item.status === "completed" ? "#E8F5E3" : "#EEF3FF", fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "0.1em", color: item.status === "completed" ? "#4A8A3A" : "#4A5ABA", textTransform: "uppercase" }}>
                {item.status}
              </div>
            </div>
          ))}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>Vitals on File</div>
            {[["Blood Pressure", "118/76"], ["Heart Rate", "72 bpm"], ["Blood Type", "A+"], ["Weight", "74 kg"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.08em" }}>{k}</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: T.dark, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card style={{ background: `${T.redAccent}10`, border: `1px solid ${T.red}` }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: T.redAccent, marginBottom: 8 }}>Presage AI Insight</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 14, color: T.dark, lineHeight: 1.6 }}>
              "Your vitals look stable. Consider scheduling your annual eye exam — last recorded 14 months ago."
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function DoctorPortal({ onBack }) {
  return (
    <PageShell title="Doctor Portal" icon="⊕" subtitle="Clinical dashboard — Dr. Sharma" onBack={onBack}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatBadge label="Today's Patients" value="12" accent />
        <StatBadge label="Pending Reviews" value="4" />
        <StatBadge label="Avg Wait Time" value="18 min" />
        <StatBadge label="Critical Alerts" value="1" accent />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 16 }}>Today's Queue</div>
          {[
            { name: "Jordan Mitchell", time: "09:00", reason: "Follow-up — cardiac", severity: 2 },
            { name: "Priya Nair",      time: "09:30", reason: "Annual physical",    severity: 1 },
            { name: "Thomas Leclerc", time: "10:00", reason: "Acute abdominal pain", severity: 4 },
            { name: "Ana Reyes",       time: "10:30", reason: "Prescription renewal", severity: 1 },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.creamBorder}`, cursor: "pointer" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.severity >= 4 ? T.redAccent : p.severity >= 3 ? "#E8C060" : "#6BBF59", flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: T.dark }}>{p.name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.muted, marginTop: 2 }}>{p.reason}</div>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.muted }}>{p.time}</div>
            </div>
          ))}
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ border: `1px solid ${T.redAccent}`, background: `${T.redAccent}08` }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: T.redAccent, marginBottom: 8 }}>⚠ Critical Alert</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: T.dark }}>Thomas Leclerc — Severity 4</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.muted, marginTop: 4 }}>Presage AI flags possible appendicitis. Expedite consultation.</div>
          </Card>
          <Card>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>Severity Scale</div>
            {[[1, "#6BBF59", "Non-urgent"], [2, "#A8C85A", "Low priority"], [3, "#E8C060", "Moderate"], [4, T.redAccent, "High urgency"], [5, T.redText, "Critical"]].map(([n, c, l]) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }}/>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.08em" }}>LEVEL {n} — {l}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function PresagePage({ onBack }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are Presage, Sanctii's medical triage AI. Analyze symptoms and give a structured JSON response ONLY (no markdown, no explanation outside JSON):
{
  "severity": 1-5,
  "recommendation": "see doctor urgently" | "schedule appointment" | "home care" | "emergency",
  "reasoning": "brief clinical reasoning",
  "homeCareTips": ["tip1", "tip2"],
  "warningSign": "specific symptom that would escalate urgency"
}
Be concise, medically accurate, and cautious. Always recommend professional consultation for anything above severity 2.`,
          messages: [{ role: "user", content: `Patient describes: ${input}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch {
      setResult({ severity: 0, recommendation: "error", reasoning: "Could not analyze. Please try again.", homeCareTips: [], warningSign: "" });
    }
    setLoading(false);
  };

  const severityColor = s => s >= 4 ? T.redAccent : s >= 3 ? "#E8C060" : s >= 2 ? "#A8C85A" : "#6BBF59";
  const severityLabel = s => ["—", "Non-urgent", "Low", "Moderate", "High urgency", "Critical"][s] || "—";

  return (
    <PageShell title="Presage AI" icon="◈" subtitle="Intelligent medical triage — powered by AI" onBack={onBack}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 20, color: T.dark, marginBottom: 6 }}>
            Describe your symptoms
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: "0.1em", marginBottom: 16 }}>
            PRESAGE WILL ASSESS SEVERITY AND ADVISE NEXT STEPS
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. I have had a headache for 3 days, mild fever 38.2°C, sore throat and fatigue..."
            style={{
              width: "100%", minHeight: 100, padding: "12px 14px",
              border: `1px solid ${T.creamBorder}`, borderRadius: 2, resize: "vertical",
              fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: T.dark,
              background: T.cream, outline: "none", lineHeight: 1.6,
            }}
            onFocus={e => { e.target.style.borderColor = T.redAccent; }}
            onBlur={e => { e.target.style.borderColor = T.creamBorder; }}
          />
          <button
            className="sanctii-btn sanctii-btn-fill"
            onClick={analyze}
            disabled={loading || !input.trim()}
            style={{ marginTop: 12, opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            {loading ? "Analyzing..." : "Analyze with Presage →"}
          </button>
        </Card>

        {loading && (
          <Card style={{ textAlign: "center", padding: 40 }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: T.red, animation: `pulseRed 1s ease ${i * 0.2}s infinite` }}/>
              ))}
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 16, color: T.muted }}>
              Presage is analyzing your symptoms...
            </div>
          </Card>
        )}

        {result && !loading && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <Card style={{ border: `2px solid ${severityColor(result.severity)}`, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${severityColor(result.severity)}20`, border: `2px solid ${severityColor(result.severity)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: severityColor(result.severity), fontFamily: "'Fraunces', serif" }}>
                  {result.severity}
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: T.muted }}>Severity Level</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 300, color: severityColor(result.severity) }}>
                    {severityLabel(result.severity)}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", padding: "8px 20px", borderRadius: 20, background: `${severityColor(result.severity)}15`, border: `1px solid ${severityColor(result.severity)}`, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: severityColor(result.severity) }}>
                  {result.recommendation}
                </div>
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 16, color: T.dark, lineHeight: 1.7, marginBottom: 16, paddingLeft: 16, borderLeft: `3px solid ${T.creamBorder}` }}>
                {result.reasoning}
              </div>
              {result.homeCareTips?.length > 0 && (
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 8 }}>Home Care</div>
                  {result.homeCareTips.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: T.dark }}>
                      <span style={{ color: T.red }}>◦</span> {tip}
                    </div>
                  ))}
                </div>
              )}
              {result.warningSign && (
                <div style={{ marginTop: 16, padding: "10px 14px", background: `${T.redAccent}10`, border: `1px solid ${T.red}`, borderRadius: 2 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.redAccent, letterSpacing: "0.12em", textTransform: "uppercase" }}>⚠ Seek immediate care if: </span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: T.dark }}>{result.warningSign}</span>
                </div>
              )}
            </Card>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.1em", textAlign: "center" }}>
              PRESAGE IS AN AI TRIAGE TOOL AND DOES NOT REPLACE PROFESSIONAL MEDICAL ADVICE
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function SchedulePage({ onBack }) {
  const [selected, setSelected] = useState(null);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30", "16:00"];
  const taken = ["09:00", "10:00", "14:30", "15:30"];

  return (
    <PageShell title="Schedule" icon="◷" subtitle="Book appointments & view calendar" onBack={onBack}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        <Card>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 20 }}>March 2026</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 24 }}>
            {days.map(d => (
              <div key={d} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.1em", textAlign: "center", paddingBottom: 8, textTransform: "uppercase" }}>{d}</div>
            ))}
            {[9,10,11,12,13,10,11,12,13,14,11,12,13,14,15,12,13,14,15,16,13,14,15,16,17].map((n, i) => (
              <div key={i} onClick={() => setSelected(n)} style={{
                padding: "8px 0", textAlign: "center", cursor: "pointer", borderRadius: 2,
                background: selected === n ? T.redAccent : i % 7 === 2 ? `${T.red}20` : "transparent",
                color: selected === n ? T.white : T.dark,
                fontFamily: "'Cormorant Garamond', serif", fontSize: 15,
                transition: "all 0.15s ease",
                border: `1px solid ${selected === n ? T.redAccent : "transparent"}`,
              }}>{n}</div>
            ))}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>Available Slots</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {slots.map(s => (
              <button key={s} disabled={taken.includes(s)} style={{
                padding: "7px 0", border: `1px solid ${taken.includes(s) ? T.creamBorder : T.redAccent}`,
                borderRadius: 2, cursor: taken.includes(s) ? "not-allowed" : "pointer",
                background: taken.includes(s) ? T.creamDark : "transparent",
                fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em",
                color: taken.includes(s) ? T.muted : T.redAccent,
                transition: "all 0.15s ease",
                opacity: taken.includes(s) ? 0.5 : 1,
              }}>{s}</button>
            ))}
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>Average Wait Times</div>
            {[["Emergency", "4 min"], ["General Practice", "18 min"], ["Specialist", "32 min"], ["Lab Work", "11 min"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.creamBorder}` }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: T.dark }}>{k}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.redAccent }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card style={{ background: `${T.redAccent}08`, border: `1px solid ${T.red}` }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: T.redAccent, marginBottom: 8 }}>Upcoming</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: T.dark }}>Mar 12, 09:30</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.muted, marginTop: 4 }}>Dr. Sharma — Cardiology</div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function HospitalPage({ onBack }) {
  return (
    <PageShell title="Find Hospital" icon="⊘" subtitle="Nearest facilities and directions" onBack={onBack}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { name: "St. Michael's Hospital", dist: "1.2 km", wait: "8 min", status: "open" },
            { name: "Toronto General", dist: "2.8 km", wait: "14 min", status: "open" },
            { name: "Mount Sinai Hospital", dist: "3.1 km", wait: "22 min", status: "open" },
            { name: "Sunnybrook Health", dist: "8.4 km", wait: "6 min", status: "open" },
          ].map((h, i) => (
            <Card key={i} style={{ cursor: "pointer", transition: "all 0.2s ease" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.redAccent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.creamBorder; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 300, color: T.dark, marginBottom: 4 }}>{h.name}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.1em" }}>{h.dist} away</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: T.redAccent }}>{h.wait}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: T.muted, letterSpacing: "0.1em" }}>AVG WAIT</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card style={{ background: T.creamDark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⊘</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 18, color: T.muted, textAlign: "center" }}>
            Interactive 3D hospital map
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.1em", marginTop: 6, textTransform: "uppercase" }}>
            Three.js visualization
          </div>
          <div style={{ marginTop: 20, padding: "8px 24px", border: `1px solid ${T.creamBorder}`, borderRadius: 2, fontFamily: "'DM Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Requires Geolocation Permission
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function RoomsPage({ onBack }) {
  const rooms = Array.from({ length: 24 }, (_, i) => ({
    id: `${Math.floor(i / 6) + 1}0${(i % 6) + 1}`,
    floor: Math.floor(i / 6) + 1,
    status: ["occupied", "occupied", "available", "maintenance", "occupied", "available"][i % 6],
    patient: ["occupied"].includes(["occupied", "occupied", "available", "maintenance", "occupied", "available"][i % 6]) ? `Patient ${i + 1}` : null,
  }));
  const statusColor = s => ({ occupied: T.redAccent, available: "#6BBF59", maintenance: "#E8C060" }[s] || T.muted);
  return (
    <PageShell title="Room Map" icon="⊞" subtitle="Live floor plan and room status" onBack={onBack}>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {[["Occupied", T.redAccent, rooms.filter(r => r.status === "occupied").length],
          ["Available", "#6BBF59", rooms.filter(r => r.status === "available").length],
          ["Maintenance", "#E8C060", rooms.filter(r => r.status === "maintenance").length]
        ].map(([l, c, n]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: `1px solid ${c}30`, borderRadius: 2, background: `${c}10` }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }}/>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: c, letterSpacing: "0.1em", textTransform: "uppercase" }}>{l}: {n}</span>
          </div>
        ))}
      </div>
      {[1,2,3,4].map(floor => (
        <div key={floor} style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: T.muted, marginBottom: 8 }}>Floor {floor}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {rooms.filter(r => r.floor === floor).map(r => (
              <div key={r.id} style={{
                padding: "10px 8px", borderRadius: 2, textAlign: "center", cursor: "pointer",
                background: `${statusColor(r.status)}15`,
                border: `1px solid ${statusColor(r.status)}40`,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${statusColor(r.status)}`; }}
              onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${statusColor(r.status)}40`; }}
              >
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.dark, letterSpacing: "0.05em" }}>{r.id}</div>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor(r.status), margin: "4px auto 0" }}/>
              </div>
            ))}
          </div>
        </div>
      ))}
    </PageShell>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const navigate = (p) => setPage(p);
  const handleLogin = (role) => { setLoggedIn(true); setUserRole(role); setPage("home"); };
  const handleBack = () => setPage("home");

  return (
    <>
      <GlobalStyle />
      <div className="grain-overlay" />
      {page === "home" && <MazeUI onNavigate={navigate} />}
      {page === "login" && <LoginPage onBack={handleBack} onLogin={handleLogin} />}
      {page === "patient" && <PatientPortal onBack={handleBack} />}
      {page === "doctor" && <DoctorPortal onBack={handleBack} />}
      {page === "presage" && <PresagePage onBack={handleBack} />}
      {page === "schedule" && <SchedulePage onBack={handleBack} />}
      {page === "hospital" && <HospitalPage onBack={handleBack} />}
      {page === "rooms" && <RoomsPage onBack={handleBack} />}
    </>
  );
}
