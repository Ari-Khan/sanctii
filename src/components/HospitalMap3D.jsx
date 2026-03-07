import { useRef, useEffect, useState } from "react";
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

let optionsSet = false;

export default function HospitalMap3D({ hospitals = [], userLocation, selectedHospital, onSelectHospital, apiKey }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isDark, setIsDark] = useState(false);

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

  // ── Load Google Maps ──
  useEffect(() => {
    if (!containerRef.current) return;
    if (!resolvedApiKey) {
      setMapError("VITE_GOOGLE_MAPS_API_KEY not set");
      return;
    }

    // Set options once
    if (!optionsSet) {
      setOptions({ apiKey: resolvedApiKey, version: "weekly" });
      optionsSet = true;
    }

    let cancelled = false;

    async function initMap() {
      try {
        const { Map } = await importLibrary("maps");
        await importLibrary("routes");

        if (cancelled || !containerRef.current) return;

        const center = getCenter();
        const map = new Map(containerRef.current, {
          center,
          zoom: 10,
          tilt: 45,
          heading: 0,
          mapTypeId: "roadmap",
          gestureHandling: "greedy",
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          rotateControl: true,
          tiltControl: true,
          styles: getLightMapStyles(),
        });

        mapRef.current = map;

        // Directions renderer
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#D4706A",
            strokeWeight: 5,
            strokeOpacity: 0.85,
          },
        });
        directionsRendererRef.current = directionsRenderer;

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
      markersRef.current.forEach(m => m.setMap && m.setMap(null));
      markersRef.current = [];
      if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    };
  }, [resolvedApiKey]);

  // ── Place markers when map loads or hospitals change ──
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const validHospitals = hospitals.filter(h => h.coords);

    validHospitals.forEach((h, i) => {
      const marker = new google.maps.Marker({
        position: { lat: h.coords.lat, lng: h.coords.lng },
        map,
        title: h.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: h.col || "#D4706A",
          fillOpacity: 0.9,
          strokeColor: "#fff",
          strokeWeight: 2,
          scale: selectedHospital === i ? 12 : 8,
        },
        zIndex: selectedHospital === i ? 100 : 10,
      });

      marker.addListener("click", () => {
        if (onSelectHospital) onSelectHospital(i);
        const content = `
          <div style="font-family:'Outfit',sans-serif;padding:4px 0;min-width:180px">
            <div style="font-weight:700;font-size:14px;color:#2A1818;margin-bottom:4px">${h.name}</div>
            <div style="font-size:11px;color:#6B4040;margin-bottom:2px">${h.address || ""}</div>
            ${h.distance ? `<div style="font-size:12px;color:#5BAA8A;font-weight:600;margin-top:6px">${h.distance.toFixed(1)} km · ${h.duration}</div>` : ""}
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // User location marker
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    if (userLocation) {
      const userMarker = new google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map,
        title: "Your Location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#4488ff",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 3,
          scale: 9,
        },
        zIndex: 200,
      });
      userMarkerRef.current = userMarker;
    }

    // Fit bounds to show all
    if (validHospitals.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      validHospitals.forEach(h => bounds.extend({ lat: h.coords.lat, lng: h.coords.lng }));
      if (userLocation) bounds.extend(userLocation);
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [mapLoaded, hospitals, userLocation, selectedHospital]);

  // ── Draw directions when hospital selected ──
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }

    if (selectedHospital == null || !userLocation) return;

    const validHospitals = hospitals.filter(h => h.coords);
    const h = validHospitals[selectedHospital];
    if (!h?.coords) return;

    // Highlight selected marker
    markersRef.current.forEach((marker, i) => {
      const isSelected = i === selectedHospital;
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: validHospitals[i]?.col || "#D4706A",
        fillOpacity: isSelected ? 1 : 0.7,
        strokeColor: isSelected ? "#fff" : "rgba(255,255,255,0.6)",
        strokeWeight: isSelected ? 3 : 2,
        scale: isSelected ? 14 : 7,
      });
      marker.setZIndex(isSelected ? 100 : 10);
    });

    // Request directions
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: userLocation.lat, lng: userLocation.lng },
        destination: { lat: h.coords.lat, lng: h.coords.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result);
          const bounds = new google.maps.LatLngBounds();
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
          2. Enable <strong>Maps JavaScript API</strong> & <strong>Directions API</strong><br />
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

      {/* Theme Toggle */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
        <button
          onClick={() => {
            const next = !isDark;
            setIsDark(next);
            if (mapRef.current) {
              mapRef.current.setOptions({ styles: next ? getDarkMapStyles() : getLightMapStyles() });
            }
          }}
          style={{
            padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(200,160,140,0.3)",
            background: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(6px)", cursor: "pointer",
            fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase",
            color: isDark ? "#D4974A" : "#6B4040",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          {isDark ? "☀" : "🌙"} {isDark ? "Light" : "Dark"}
        </button>
      </div>

      {/* Legend */}
      <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 10, pointerEvents: "none" }}>
        <div style={{ padding: "6px 10px", background: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.85)", borderRadius: 6, backdropFilter: "blur(6px)" }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 2 }}>
            <span style={{ color: "#4488ff" }}>● </span><span style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6B4040" }}>You</span>&nbsp;&nbsp;
            <span style={{ color: "#D4706A" }}>● </span><span style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6B4040" }}>Hospital</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDarkMapStyles() {
  return [
    { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#6b5a5a" }] },
    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2a2a3e" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a3e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a2a2a" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#4a3535" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#2d2535" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1a2b" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3a5a7a" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e1e30" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1a2a1a" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#5a5a6a" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#16162a" }] },
  ];
}

function getLightMapStyles() {
  return [
    { elementType: "geometry", stylers: [{ color: "#f5f0e8" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#6B4040" }] },
    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#d4c4b4" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e0d0c0" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f0ddd0" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#d4a090" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#f8ece0" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c8dce8" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#7a9ab0" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e8e0d4" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d4e8d0" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#9a8a7a" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#e8e0d4" }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f0e8dc" }] },
  ];
}
