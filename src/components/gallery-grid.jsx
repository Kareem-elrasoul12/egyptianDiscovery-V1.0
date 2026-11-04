"use client";

import { MediaImage } from "./media-image";
import { useSite } from "./site-context";

export default function GalleryGrid({ items }) {
  const {lang}=useSite();
  return <div className="gallery-grid">{items.map((item) => {const caption=lang==="ar"?(item.caption_ar||item.caption_en||item.trips?.name_ar||item.trips?.name_en):(item.caption_en||item.trips?.name_en);return <figure key={item.id}>
    <MediaImage source={item.image_path} width={1000} alt={caption || (lang==="ar"?"رحلة من رحلات إيجيبت ديسكفري":"Egyptian Discovery trip")} loading="lazy" />
    <figcaption>{caption}</figcaption>
  </figure>})}</div>;
}
