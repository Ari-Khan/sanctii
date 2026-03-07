import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// ─── Facts per floor ──────────────────────────────────────────────────────────
const FLOOR_FACTS = {
  Emergency: {
    title: "Golden Hour — Emergency",
    facts: [
      "The first 60 min after major trauma are critical — immediate action can cut mortality by up to 85%.",
      "Rapid hemorrhage control and airway management are the top priorities in the golden window.",
      "Trauma centers that receive patients within the golden hour see significantly better outcomes.",
    ],
  },
  Radiology: {
    title: "Imaging Speed Saves Lives",
    facts: [
      "CT scans can detect internal bleeding in under 5 minutes — crucial for golden-time decisions.",
      "Every 10-minute delay in stroke imaging costs ~1 week of disability-free life.",
      "Point-of-care ultrasound (POCUS) can guide emergency decisions within seconds.",
    ],
  },
  Surgery: {
    title: "Surgical Golden Window",
    facts: [
      "Every minute without stroke treatment destroys ~1.9 million neurons.",
      "Surgical intervention within 3–6 hours of symptom onset dramatically improves outcomes.",
      "For ruptured aortic aneurysm, survival drops under 50% without surgery within 6 hours.",
    ],
  },
  Cardiology: {
    title: "Time Is Muscle",
    facts: [
      "Each minute of STEMI (heart attack) delay destroys ~2 billion cardiomyocytes.",
      "Door-to-balloon time under 90 min is the global benchmark for saving heart tissue.",
      "Bystander CPR doubles or triples cardiac arrest survival before paramedics arrive.",
    ],
  },
  ICU: {
    title: "ICU & Sepsis Golden Hour",
    facts: [
      "Sepsis survival drops ~7.6% for each hour antibiotics are delayed.",
      "Early goal-directed therapy in the first 6 hours of sepsis reduces mortality by up to 16%.",
      "Rapid response teams activating within 1 hour of deterioration cut ICU admissions by 30%.",
    ],
  },
};

// Holographic colour palette
const C = {
  vital:  0x5BAA8A,
  rose:   0xD4706A,
  amber:  0xD4974A,
  purple: 0x8B6FBF,
  white:  0xFFFFFF,
};

// ─── Helper: wireframe + fill group ──────────────────────────────────────────
function holoBox(w, h, d, color, edgeOp = 0.85, fillOp = 0.04) {
  const geo   = new THREE.BoxGeometry(w, h, d);
  const edges = new THREE.EdgesGeometry(geo);

  const edgeMat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: edgeOp,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const fillMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: fillOp,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const g = new THREE.Group();
  g.add(new THREE.LineSegments(edges, edgeMat));
  g.add(new THREE.Mesh(geo, fillMat));
  return g;
}

// ─── Helper: ring on XZ plane ─────────────────────────────────────────────────
function holoRing(inner, outer, color, op = 0.5) {
  const geo = new THREE.RingGeometry(inner, outer, 64);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: op,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  return m;
}

// ─── Helper: text canvas sprite ───────────────────────────────────────────────
function makeLabel(text, color = "#5BAA8A") {
  const canvas  = document.createElement("canvas");
  canvas.width  = 256;
  canvas.height = 48;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 22px 'DM Mono', monospace";
  ctx.fillStyle = color;
  ctx.letterSpacing = "4px";
  ctx.fillText(text.toUpperCase(), 10, 34);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.2, 0.6, 1);
  return sprite;
}

// ─── Tooltip component ────────────────────────────────────────────────────────
function Tooltip({ info, mousePos }) {
  if (!info) return null;
  const { title, facts } = info;
  const fact = facts[Math.floor(Date.now() / 1000) % facts.length];

  return (
    <div style={{
      position: "fixed",
      left: mousePos.x + 18,
      top:  mousePos.y - 10,
      maxWidth: 300,
      background: "rgba(4, 20, 18, 0.92)",
      border: "1px solid rgba(91, 170, 138, 0.55)",
      borderRadius: 10,
      padding: "12px 16px",
      color: "#d0f0e6",
      fontFamily: "'DM Mono', monospace",
      fontSize: 13,
      lineHeight: 1.55,
      pointerEvents: "none",
      zIndex: 1000,
      backdropFilter: "blur(6px)",
      boxShadow: "0 0 24px rgba(91,170,138,0.25), 0 2px 8px rgba(0,0,0,0.6)",
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: "#7ee8c0", fontSize: 14 }}>
        {title}
      </div>
      <div style={{ opacity: 0.9 }}>{fact}</div>
      <div style={{ marginTop: 8, fontSize: 11, opacity: 0.45, letterSpacing: "0.05em" }}>
        HOVER TO EXPLORE · HEALTHCARE DATA
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HospitalHologram() {
  const mountRef   = useRef(null);
  const tooltipRef = useRef({ setInfo: null });

  const [tooltipInfo, setTooltipInfo] = useState(null);
  const [mousePos,    setMousePos]    = useState({ x: 0, y: 0 });

  tooltipRef.current.setInfo = setTooltipInfo;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let W = mount.clientWidth;
    let H = mount.clientHeight;

    // ── Scene & Camera ──────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(14, 14, 22);

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Hospital group ──────────────────────────────────────────────────────
    const hospital = new THREE.Group();

    // Main tower
    const tower = holoBox(6, 14, 5, C.vital, 0.9, 0.05);
    tower.position.set(0, 7, 0);
    hospital.add(tower);

    // Wings
    const wL = holoBox(4.5, 7, 4, C.vital, 0.6, 0.03);
    wL.position.set(-5.25, 3.5, 0);
    hospital.add(wL);

    const wR = holoBox(4.5, 7, 4, C.vital, 0.6, 0.03);
    wR.position.set(5.25, 3.5, 0);
    hospital.add(wR);

    // Low connecting base
    const base = holoBox(15, 1.2, 5, C.vital, 0.4, 0.02);
    base.position.set(0, 0.6, 0);
    hospital.add(base);

    // Entrance canopy
    const canopy = holoBox(3.5, 2.5, 3, C.rose, 0.8, 0.06);
    canopy.position.set(0, 1.25, 4);
    hospital.add(canopy);

    // Roof helipad
    const helipad = holoBox(3.2, 0.12, 3.2, C.amber, 1, 0.12);
    helipad.position.set(0, 14.06, 0);
    hospital.add(helipad);

    // Helipad H marking
    const hH = holoBox(0.25, 0.06, 1.8, C.amber, 1, 0);
    hH.position.set(-0.5, 14.13, 0);
    hospital.add(hH);
    const hH2 = hH.clone();
    hH2.position.set(0.5, 14.13, 0);
    hospital.add(hH2);
    const hHbar = holoBox(1.5, 0.06, 0.25, C.amber, 1, 0);
    hHbar.position.set(0, 14.13, 0);
    hospital.add(hHbar);

    // Medical cross on roof
    const crossV = holoBox(0.45, 2.4, 0.45, C.rose, 1, 0.1);
    crossV.position.set(0, 15.5, 0);
    hospital.add(crossV);
    const crossH = holoBox(2.2, 0.45, 0.45, C.rose, 1, 0.1);
    crossH.position.set(0, 15.9, 0);
    hospital.add(crossH);

    // Floor dividers on main tower
    const FLOORS = [
      { y: 2.4, label: "Emergency",  color: "#D4706A" },
      { y: 4.8, label: "Radiology",  color: "#5BAA8A" },
      { y: 7.2, label: "Surgery",    color: "#8B6FBF" },
      { y: 9.6, label: "Cardiology", color: "#D4974A" },
      { y:12.0, label: "ICU",        color: "#5BAA8A" },
    ];
    // Collect label sprites + hit meshes for raycasting
    const labelTargets = [];

    FLOORS.forEach(({ y, label, color }) => {
      const line = holoBox(6.1, 0.06, 5.1, parseInt(color.replace("#","0x")), 0.3, 0);
      line.position.set(0, y, 0);
      hospital.add(line);

      const sprite = makeLabel(label, color);
      sprite.position.set(-4.6, y + 0.9, 0);
      sprite.userData.floorLabel = label;
      hospital.add(sprite);
      labelTargets.push(sprite);

      // Invisible hit-target plane for easier picking
      const hitMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 0.8),
        new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
      );
      hitMesh.position.set(-4.6, y + 0.9, 0);
      hitMesh.userData.floorLabel = label;
      hospital.add(hitMesh);
      labelTargets.push(hitMesh);
    });

    // Window grid (front face)
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const lit = Math.random() > 0.25;
        const winGeo = new THREE.PlaneGeometry(0.55, 0.7);
        const winMat = new THREE.MeshBasicMaterial({
          color: lit ? C.vital : 0x112222,
          transparent: true,
          opacity: lit ? (0.15 + Math.random() * 0.35) : 0.05,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(-2.1 + col * 1.45, 1.5 + row * 2.1, 2.51);
        hospital.add(win);
      }
    }

    // Wing windows
    [-5.25, 5.25].forEach((x) => {
      const sign = x < 0 ? 1 : -1;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
          const lit = Math.random() > 0.3;
          const wg = new THREE.PlaneGeometry(0.5, 0.6);
          const wm = new THREE.MeshBasicMaterial({
            color: lit ? C.vital : 0x112222,
            transparent: true,
            opacity: lit ? 0.18 : 0.04,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const ww = new THREE.Mesh(wg, wm);
          ww.position.set(x + sign * (col * 1.2 - 0.6), 1.2 + row * 2, 2.01);
          hospital.add(ww);
        }
      }
    });

    hospital.position.y = -6;
    scene.add(hospital);

    // ── Ground plane ────────────────────────────────────────────────────────
    const grid = new THREE.GridHelper(40, 24, C.vital, C.vital);
    grid.material.opacity = 0.06;
    grid.material.transparent = true;
    grid.position.y = -6;
    scene.add(grid);

    // Ground glow rings (3 expanding)
    const rings = [];
    [7, 11, 16].forEach((r, i) => {
      const ring = holoRing(r - 0.08, r, i === 0 ? C.rose : C.vital, i === 0 ? 0.4 : 0.18);
      ring.position.y = -5.98;
      scene.add(ring);
      rings.push({ mesh: ring, baseOp: i === 0 ? 0.4 : 0.18, phase: i * 1.1 });
    });

    // ── Scan beam ────────────────────────────────────────────────────────────
    const scanGeo = new THREE.BoxGeometry(6.2, 0.1, 5.2);
    const scanMat = new THREE.MeshBasicMaterial({
      color: C.rose,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const scan = new THREE.Mesh(scanGeo, scanMat);
    hospital.add(scan);

    // Scan glow plane (wider halo)
    const scanGlowGeo = new THREE.BoxGeometry(6.8, 0.6, 5.8);
    const scanGlowMat = new THREE.MeshBasicMaterial({
      color: C.rose,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const scanGlow = new THREE.Mesh(scanGlowGeo, scanGlowMat);
    hospital.add(scanGlow);

    // ── Data pillars (shooting beams from ground) ─────────────────────────
    const pillarPositions = [[-7, 0], [7, 0], [0, -7], [0, 7], [-5, 5], [5, -5]];
    const pillars = pillarPositions.map(([px, pz]) => {
      const geo = new THREE.CylinderGeometry(0.04, 0.04, 20, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: C.vital,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(px, 4, pz);
      scene.add(m);
      return { mesh: m, phase: Math.random() * Math.PI * 2 };
    });

    // ── Particles ────────────────────────────────────────────────────────────
    const PARTICLE_COUNT = 120;
    const pPositions = new Float32Array(PARTICLE_COUNT * 3);
    const pSpeeds    = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 14;
      pPositions[i * 3]     = Math.cos(angle) * radius;
      pPositions[i * 3 + 1] = -6 + Math.random() * 24;
      pPositions[i * 3 + 2] = Math.sin(angle) * radius;
      pSpeeds[i] = 0.01 + Math.random() * 0.025;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: C.vital,
      size: 0.09,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particleMesh = new THREE.Points(pGeo, pMat);
    scene.add(particleMesh);

    // ── Orbit rings (decorative horizontal rings around building) ──────────
    const orbitRings = [3.5, 5.5, 8].map((r, i) => {
      const geo = new THREE.TorusGeometry(r, 0.025, 8, 64);
      const mat = new THREE.MeshBasicMaterial({
        color: i === 1 ? C.rose : C.vital,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = Math.PI / 2 + (i * 0.18);
      m.position.y = 2 + i * 2.5;
      scene.add(m);
      return { mesh: m, speed: 0.003 + i * 0.002, axis: new THREE.Vector3(0.1 * (i % 2 ? 1 : -1), 1, 0.05).normalize() };
    });

    // ── Orbit Controls ───────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping    = true;
    controls.dampingFactor    = 0.04;
    controls.minDistance      = 12;
    controls.maxDistance      = 45;
    controls.maxPolarAngle    = Math.PI * 0.52;
    controls.autoRotate       = true;
    controls.autoRotateSpeed  = 0.55;
    controls.target.set(0, 2, 0);

    // Stop auto-rotate while user drags
    renderer.domElement.addEventListener("pointerdown", () => { controls.autoRotate = false; });
    renderer.domElement.addEventListener("pointerup",   () => { controls.autoRotate = true; });

    // ── Raycaster for hover ──────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();

    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(labelTargets, false);

      if (hits.length > 0) {
        const label = hits[0].object.userData.floorLabel;
        if (label && FLOOR_FACTS[label]) {
          tooltipRef.current.setInfo(FLOOR_FACTS[label]);
          mount.style.cursor = "pointer";
          return;
        }
      }
      tooltipRef.current.setInfo(null);
      mount.style.cursor = "grab";
    };

    mount.addEventListener("mousemove", onMouseMove);

    // ── Animation loop ───────────────────────────────────────────────────────
    let frame;
    const clock = new THREE.Clock();
    const posAttr = pGeo.attributes.position;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Scan beam sweep (0 → 14 within the tower)
      const scanY = Math.sin(t * 0.6) * 7;
      scan.position.y     = scanY;
      scanGlow.position.y = scanY;
      scan.material.opacity     = 0.1 + Math.abs(Math.sin(t * 1.2)) * 0.12;
      scanGlow.material.opacity = 0.02 + Math.abs(Math.sin(t * 1.2)) * 0.04;

      // Ground rings pulse
      rings.forEach(({ mesh, baseOp, phase }) => {
        mesh.material.opacity = baseOp * (0.5 + 0.5 * Math.sin(t * 1.4 + phase));
      });

      // Pulsing cross
      const crossPulse = 1 + Math.sin(t * 2.5) * 0.08;
      crossV.scale.setScalar(crossPulse);
      crossH.scale.setScalar(crossPulse);

      // Pillar opacity flicker
      pillars.forEach(({ mesh, phase }) => {
        mesh.material.opacity = 0.05 + 0.1 * Math.abs(Math.sin(t * 1.1 + phase));
      });

      // Particles drift upward + reset
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        posAttr.array[i * 3 + 1] += pSpeeds[i];
        if (posAttr.array[i * 3 + 1] > 18) {
          posAttr.array[i * 3 + 1] = -6;
        }
      }
      posAttr.needsUpdate = true;

      // Orbit rings slow rotation
      orbitRings.forEach(({ mesh, speed, axis }) => {
        mesh.rotateOnAxis(axis, speed);
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ───────────────────────────────────────────────────────────────
    const onResize = () => {
      W = mount.clientWidth;
      H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      mount.removeEventListener("mousemove", onMouseMove);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mountRef}
        style={{ width: "100%", height: "100%", cursor: "grab" }}
        onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
        onMouseDown={e => { e.currentTarget.style.cursor = "grabbing"; }}
        onMouseUp={e   => { e.currentTarget.style.cursor = "grab"; }}
      />
      <Tooltip info={tooltipInfo} mousePos={mousePos} />
    </div>
  );
}
