export const EGYPT_MAP = {
  width: 520,
  height: 470,
  minLon: 23.9,
  maxLon: 37.6,
  minLat: 20.8,
  maxLat: 32.4,
  padding: 16,
  cosine: Math.cos((27 * Math.PI) / 180),
};

const mapScale = Math.min(
  (EGYPT_MAP.width - 2 * EGYPT_MAP.padding) /
    ((EGYPT_MAP.maxLon - EGYPT_MAP.minLon) * EGYPT_MAP.cosine),
  (EGYPT_MAP.height - 2 * EGYPT_MAP.padding) /
    (EGYPT_MAP.maxLat - EGYPT_MAP.minLat),
);
const offsetX = (EGYPT_MAP.width - (EGYPT_MAP.maxLon - EGYPT_MAP.minLon) * EGYPT_MAP.cosine * mapScale) / 2;
const offsetY = (EGYPT_MAP.height - (EGYPT_MAP.maxLat - EGYPT_MAP.minLat) * mapScale) / 2;

// Matches the equirectangular map projection used by public/egypt-outline.svg.
export function mapPoint(lon, lat) {
  return {
    left: `${(offsetX + (Number(lon) - EGYPT_MAP.minLon) * EGYPT_MAP.cosine * mapScale) / EGYPT_MAP.width * 100}%`,
    top: `${(offsetY + (EGYPT_MAP.maxLat - Number(lat)) * mapScale) / EGYPT_MAP.height * 100}%`,
  };
}

export const EGYPT_MAP_LANDMARKS = [
  { id: "alexandria", name: "Alexandria", ar: "الإسكندرية", lat: 31.2001, lon: 29.9187 },
  { id: "cairo", name: "Cairo", ar: "القاهرة", lat: 30.0444, lon: 31.2357, labelSide: "above" },
  { id: "siwa", name: "Siwa Oasis", ar: "واحة سيوة", lat: 29.2032, lon: 25.5195 },
  { id: "fayoum", name: "Fayoum", ar: "الفيوم", lat: 29.3084, lon: 30.8428, labelSide: "left" },
  { id: "saint-catherine", name: "St Catherine", ar: "سانت كاترين", lat: 28.5619, lon: 33.945, labelSide: "left" },
  { id: "hurghada", name: "Hurghada", ar: "الغردقة", lat: 27.2579, lon: 33.8116, labelSide: "left" },
  { id: "luxor", name: "Luxor", ar: "الأقصر", lat: 25.6872, lon: 32.6396 },
  { id: "aswan", name: "Aswan", ar: "أسوان", lat: 24.0889, lon: 32.8998 },
];
