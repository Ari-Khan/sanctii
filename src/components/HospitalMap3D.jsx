import { useRef, useEffect, useState } from "react";

// New functional API from @googlemaps/js-api-loader v2
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

/**
 * HospitalMap3D — Google Maps 3D interactive hospital map.
 *
 * Props:
 *   hospitals         – array of { name, coords: {lat,lng}, col, distance, duration, address }
 *   userLocation      – { lat, lng }
 *   selectedHospital  – index of selected hospital (or null)
 *   onSelectHospital  – callback(index)
 *   apiKey            – Google Maps API key
 */

let optionsConfigured = false;

/** Creates a circle-pin DOM element for AdvancedMarkerElement */
function createCirclePin({ color = "#D4706A", size = 16, strokeColor = "#fff", strokeWidth = 2, opacity = 0.9 }) {
  const el = document.createElement("div");
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = "50%";
  el.style.backgroundColor = color;
  el.style.opacity = String(opacity);
  el.style.border = `${strokeWidth}px solid ${strokeColor}`;
  el.style.cursor = "pointer";
  el.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
  el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  return el;
}

/** Updates an existing circle-pin DOM element's styles */
function updateCirclePin(el, { color, size, strokeColor, strokeWidth, opacity }) {
  if (color !== undefined) el.style.backgroundColor = color;
  if (size !== undefined) { el.style.width = `${size}px`; el.style.height = `${size}px`; }
  if (strokeColor !== undefined) el.style.borderColor = strokeColor;
  if (strokeWidth !== undefined) el.style.borderWidth = `${strokeWidth}px`;
  if (opacity !== undefined) el.style.opacity = String(opacity);
}

export default function HospitalMap3D({ hospitals = [], userLocation, selectedHospital, onSelectHospital, apiKey }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const infoWindowRef = useRef(null);
  const gmapsRef = useRef(null);       // stores google.maps namespace
  const AdvMarkerRef = useRef(null);    // stores AdvancedMarkerElement class
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  const resolvedApiKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const getCenter = () => {
    if (userLocation) return { lat: userLocation.lat, lng: userLocation.lng };
    const valid = hospitals.filter(h => h.coords);
    if (!valid.length) return { lat: 43.65, lng: -79.38 };
    const lats = valid.map(h => h.coords.lat);
    const lngs = valid.map(h => h.coords.lng);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  };

  // ── Load Google Maps (new API) ──
  useEffect(() => {
    if (!containerRef.current) return;
    if (!resolvedApiKey) {
      setMapError("VITE_GOOGLE_MAPS_API_KEY not set");
      return;
    }

    let cancelled = false;

    async function initMap() {
      try {
        // Configure API key once (must be called before first importLibrary)
        if (!optionsConfigured) {
          setOptions({ key: resolvedApiKey, v: "weekly" });
          optionsConfigured = true;
        }

        // Import required libraries using the new functional API
        const [mapsLib, coreLib, routesLib, markerLib] = await Promise.all([
          importLibrary("maps"),
          importLibrary("core"),
          importLibrary("routes"),
          importLibrary("marker"),
        ]);

        if (cancelled || !containerRef.current) return;

        // Store google.maps reference & AdvancedMarkerElement for use in other effects
        gmapsRef.current = google.maps;
        AdvMarkerRef.current = markerLib.AdvancedMarkerElement;

        const { Map, Polyline } = mapsLib;
        const center = getCenter();
        const map = new Map(containerRef.current, {
          center,
          zoom: 10,
          tilt: 45,
          heading: 0,
          mapId: "DEMO_MAP_ID", // required for AdvancedMarkerElement. "DEMO_MAP_ID" is standard if you don't have a custom Cloud Map ID.
          mapTypeId: "roadmap",
          gestureHandling: "greedy",
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          rotateControl: true,
          tiltControl: true,
          // Removed static `styles: getLightMapStyles()` as it conflicts with `mapId`.
          // Map styling must now be configured in the Google Cloud Console.
        });

        mapRef.current = map;

        // Create a Polyline for the route instead of using the deprecated DirectionsRenderer
        routePolylineRef.current = new Polyline({
          map,
          strokeColor: "#D4706A",
          strokeWeight: 5,
          strokeOpacity: 0.85,
        });

        // Info window
        infoWindowRef.current = new google.maps.InfoWindow();

        setMapLoaded(true);
      } catch (err) {
        console.error("Google Maps load error:", err);
        if (!cancelled) setMapError("Failed to load Google Maps: " + err.message);
      }
    }

    initMap();

    return () => {
      cancelled = true;
      markersRef.current.forEach(m => { if (m.map) m.map = null; });
      markersRef.current = [];
      if (userMarkerRef.current) userMarkerRef.current.map = null;
      if (routePolylineRef.current) routePolylineRef.current.setMap(null);
    };
  }, [resolvedApiKey]);

  // ── Place markers when map loads or hospitals change ──
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !gmapsRef.current || !AdvMarkerRef.current) return;
    const map = mapRef.current;
    const gm = gmapsRef.current;
    const AdvancedMarkerElement = AdvMarkerRef.current;

    // Clear old markers
    markersRef.current.forEach(m => { m.map = null; });
    markersRef.current = [];

    const validHospitals = hospitals.filter(h => h.coords);

    validHospitals.forEach((h, i) => {
      const isSelected = selectedHospital === i;
      const pinEl = createCirclePin({
        color: h.col || "#D4706A",
        size: isSelected ? 24 : 16,
        strokeColor: "#fff",
        strokeWidth: 2,
        opacity: 0.9,
      });

      const marker = new AdvancedMarkerElement({
        position: { lat: h.coords.lat, lng: h.coords.lng },
        map,
        title: h.name,
        content: pinEl,
        zIndex: isSelected ? 100 : 10,
      });

      marker.addEventListener("gmp-click", () => {
        if (onSelectHospital) onSelectHospital(i);
        const content = `
          <div style="font-family:'Outfit',sans-serif;padding:4px 0;min-width:180px">
            <div style="font-weight:700;font-size:14px;color:#2A1818;margin-bottom:4px">${h.name}</div>
            <div style="font-size:11px;color:#6B4040;margin-bottom:2px">${h.address || ""}</div>
            ${h.distance ? `<div style="font-size:12px;color:#5BAA8A;font-weight:600;margin-top:6px">${h.distance.toFixed(1)} km · ${h.duration}</div>` : ""}
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open({ anchor: marker, map });
      });

      markersRef.current.push(marker);
    });

    // User location marker
    if (userMarkerRef.current) userMarkerRef.current.map = null;
    if (userLocation) {
      const userPinEl = createCirclePin({
        color: "#4488ff",
        size: 18,
        strokeColor: "#fff",
        strokeWidth: 3,
        opacity: 1,
      });

      const userMarker = new AdvancedMarkerElement({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map,
        title: "Your Location",
        content: userPinEl,
        zIndex: 200,
      });
      userMarkerRef.current = userMarker;
    }

    // Fit bounds to show all
    if (validHospitals.length > 0) {
      const bounds = new gm.LatLngBounds();
      validHospitals.forEach(h => bounds.extend({ lat: h.coords.lat, lng: h.coords.lng }));
      if (userLocation) bounds.extend(userLocation);
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [mapLoaded, hospitals, userLocation, selectedHospital]);

  // ── Draw directions when hospital selected ──
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !gmapsRef.current) return;
    const gm = gmapsRef.current;

    if (routePolylineRef.current) {
      routePolylineRef.current.setPath([]);
    }

    if (selectedHospital == null || !userLocation) return;

    const validHospitals = hospitals.filter(h => h.coords);
    const h = validHospitals[selectedHospital];
    if (!h?.coords) return;

    // Highlight selected marker by updating its pin element
    markersRef.current.forEach((marker, i) => {
      const isSelected = i === selectedHospital;
      const pinEl = marker.content;
      if (pinEl && pinEl.style) {
        updateCirclePin(pinEl, {
          color: validHospitals[i]?.col || "#D4706A",
          size: isSelected ? 28 : 14,
          strokeColor: isSelected ? "#fff" : "rgba(255,255,255,0.6)",
          strokeWidth: isSelected ? 3 : 2,
          opacity: isSelected ? 1 : 0.7,
        });
      }
      marker.zIndex = isSelected ? 100 : 10;
    });

    // Request directions
    const directionsService = new gm.DirectionsService();
    directionsService.route(
      {
        origin: { lat: userLocation.lat, lng: userLocation.lng },
        destination: { lat: h.coords.lat, lng: h.coords.lng },
        travelMode: gm.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && routePolylineRef.current) {
          const path = result.routes[0].overview_path;
          routePolylineRef.current.setPath(path);
          
          const bounds = new gm.LatLngBounds();
          bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
          bounds.extend({ lat: h.coords.lat, lng: h.coords.lng });
          mapRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
          setTimeout(() => {
            if (mapRef.current.setTilt) mapRef.current.setTilt(45);
          }, 500);
        }
      }
    );
  }, [selectedHospital, mapLoaded, userLocation]);

  // ── Fallback: no API key ──
  if (!resolvedApiKey || mapError) {
    return (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: "#0a0a0f",
        borderRadius: 20, fontFamily: "'Outfit',sans-serif", color: "#A08070", padding: 30,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#D4706A", marginBottom: 8 }}>
          Google Maps API Key Required
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 360 }}>
          {mapError || "To enable the interactive 3D map with real roads and buildings:"}
        </div>
        <div style={{ marginTop: 16, fontSize: 12, color: "#6B4040", lineHeight: 1.8, textAlign: "left" }}>
          1. Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: "#5BAA8A" }}>Google Cloud Console</a><br />
          2. Enable <strong>Maps JavaScript API</strong> &amp; <strong>Directions API</strong><br />
          3. Create an API key<br />
          4. Add to your project root <code>.env</code> file:<br />
          <code style={{ display: "block", margin: "8px 0", padding: "8px 12px", background: "#141418", borderRadius: 6, color: "#5BAA8A", fontSize: 11 }}>
            VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
          </code>
          5. Restart the dev server
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", borderRadius: 20 }} />

      {/* HUD Overlay */}
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, display: "flex", flexDirection: "column", gap: 5, pointerEvents: "none" }}>
        {selectedHospital != null && (
          <div style={{ padding: "4px 10px", background: "rgba(0,0,0,0.6)", borderRadius: 6, border: "1px solid rgba(212,112,106,0.3)", backdropFilter: "blur(6px)" }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: "#D4706A", letterSpacing: "0.14em", textTransform: "uppercase" }}>Route Active</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 10, pointerEvents: "none" }}>
        <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.85)", borderRadius: 6, backdropFilter: "blur(6px)" }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 2 }}>
            <span style={{ color: "#4488ff" }}>● </span><span style={{ color: "#6B4040" }}>You</span>&nbsp;&nbsp;
            <span style={{ color: "#D4706A" }}>● </span><span style={{ color: "#6B4040" }}>Hospital</span>
          </div>
        </div>
      </div>
    </div>
  );
}
