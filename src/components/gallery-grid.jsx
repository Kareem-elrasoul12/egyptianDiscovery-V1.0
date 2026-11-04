"use client";

import { MediaImage } from "./media-image";

export default function GalleryGrid({ items }) {
  return <div className="gallery-grid">{items.map((item) => <figure key={item.id}>
    <MediaImage source={item.image_path} width={1000} alt={item.caption_en || item.trips?.name_en || "Egyptian Discovery trip"} loading="lazy" />
    <figcaption>{item.caption_en || item.trips?.name_en}</figcaption>
  </figure>)}</div>;
}
