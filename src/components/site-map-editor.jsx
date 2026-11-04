"use client";

import { useSite } from "./site-context";
import { MediaImage } from "./media-image";

const bounds = { minLon: 24.5, maxLon: 36.9, minLat: 21.7, maxLat: 31.7 };
function pointStyle(location) {
  return { left: `${((Number(location.lon) - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 100}%`, top: `${((bounds.maxLat - Number(location.lat)) / (bounds.maxLat - bounds.minLat)) * 100}%` };
}

export default function SiteMapEditor() {
  const { demo, updateDemo } = useSite();
  const locations = demo.mapLocations || [];
  function update(id, key, value) {
    updateDemo((current) => ({ ...current, mapLocations: (current.mapLocations || []).map((item) => item.id === id ? { ...item, [key]: value } : item) }));
  }
  return <section className="account-panel site-map-editor">
    <div className="page-intro admin-subhead"><p className="eyebrow">EGYPT ATLAS <i/></p><h2>Map & locations</h2><p>Adjust destination pins on the home page using WGS 84 latitude and longitude. Updates appear on the map immediately.</p></div>
    <div className="site-map-preview" role="img" aria-label="Egypt map preview with current destination markers"><MediaImage source="/egypt-outline.svg" alt=""/><div className="map-nile-label">NILE</div>{locations.filter((item) => item.active !== false).map((item) => <span className={`site-map-dot ${item.reference ? "reference" : ""}`} style={pointStyle(item)} key={item.id} title={item.name}/>)}</div>
    <div className="site-map-location-list">{locations.map((item) => <article className="site-map-location" key={item.id}>
      <label>Location name<input value={item.name} onChange={(event) => update(item.id, "name", event.target.value)} /></label>
      <label>Latitude<input type="number" min={bounds.minLat} max={bounds.maxLat} step="0.0001" value={item.lat} onChange={(event) => update(item.id, "lat", Number(event.target.value))}/></label>
      <label>Longitude<input type="number" min={bounds.minLon} max={bounds.maxLon} step="0.0001" value={item.lon} onChange={(event) => update(item.id, "lon", Number(event.target.value))}/></label>
      <label className="site-map-visible"><input type="checkbox" checked={item.active !== false} onChange={(event) => update(item.id, "active", event.target.checked)}/> Show pin</label>
      <small>{Number(item.lat).toFixed(4)}° N · {Number(item.lon).toFixed(4)}° E</small>
    </article>)}</div>
    <p className="preview-disclaimer">The Egypt boundary remains a fixed geographic asset; location labels, coordinates, and visibility are editable in this browser’s admin workspace.</p>
  </section>;
}
