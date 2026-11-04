export const MEDIA_LIBRARY = [
  { key: "brand-logo", source: "/logo-transparent.png", label: "Egyptian Discovery logo", group: "Brand" },
  { key: "photo-1509316785289-025f5b846b35", source: "photo-1509316785289-025f5b846b35", label: "Desert hero and Siwa landscape", group: "Destinations & backgrounds" },
  { key: "photo-1464822759023-fed622ff2c3b", source: "photo-1464822759023-fed622ff2c3b", label: "South Sinai mountains", group: "Destinations & trips" },
  { key: "photo-1470770841072-f978cf4d019e", source: "photo-1470770841072-f978cf4d019e", label: "Fayoum lakes and dunes", group: "Destinations & trips" },
  { key: "photo-1500530855697-b586d89ba3ee", source: "photo-1500530855697-b586d89ba3ee", label: "White Desert landscape", group: "Destinations & gallery" },
  { key: "photo-1518837695005-2083093ee35b", source: "photo-1518837695005-2083093ee35b", label: "Siwa trip feature", group: "Trips" },
  { key: "photo-1455390582262-044cdead277a", source: "photo-1455390582262-044cdead277a", label: "Field Notes Journal", group: "Shop" },
  { key: "photo-1602143407151-7111542de6e8", source: "photo-1602143407151-7111542de6e8", label: "Trail Bottle", group: "Shop" },
  { key: "photo-1590874103328-eac38a683ce7", source: "photo-1590874103328-eac38a683ce7", label: "Palm Weave Day Bag", group: "Shop" },
  { key: "photo-1521369909029-2afed882baee", source: "photo-1521369909029-2afed882baee", label: "Wide Brim Sun Hat", group: "Shop" },
  { key: "photo-1470252649378-9c29740c9fa8", source: "photo-1470252649378-9c29740c9fa8", label: "Our story section background", group: "Page backgrounds" },
  { key: "photo-1464278533981-50106e6176b1", source: "photo-1464278533981-50106e6176b1", label: "About page feature", group: "Pages" },
  { key: "egypt-outline", source: "/egypt-outline.svg", label: "Egypt geographic map outline", group: "Maps", locked: true },
];

export function getMediaEntries(demo) {
  const entries = [...MEDIA_LIBRARY];
  const add = (source, label, group) => {
    if (!source) return;
    if (entries.some((entry) => entry.key === source)) return;
    entries.push({ key: source, source, label, group });
  };
  (demo?.destinations || []).forEach((item) => {
    const images = item.images?.length ? item.images : [item.image || item.hero_image];
    images.forEach((source, index) => add(source, `${item.name || item.name_en || "Destination"} photo ${index + 1}`, "Destinations"));
  });
  (demo?.trips || []).forEach((item) => {
    const images = item.images?.length ? item.images : [item.image || item.hero_image];
    images.forEach((source, index) => add(source, `${item.name || item.name_en || "Trip"} photo ${index + 1}`, "Trips"));
  });
  (demo?.products || []).forEach((item) => (item.images || []).forEach((image) => add(image, item.name_en || "Product image", "Shop")));
  (demo?.gallery || []).forEach((item) => add(item.image_path || item.image, item.caption_en || "Community gallery image", "Gallery"));
  return entries;
}
