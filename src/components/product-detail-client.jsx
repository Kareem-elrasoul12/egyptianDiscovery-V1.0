"use client";

import Link from "next/link";
import { useState } from "react";
import { useSite } from "./site-context";
import { imageUrl } from "../data/content";

export default function ProductDetailClient({ product }) {
  const { lang, addToCart, demo } = useSite();
  const ar = lang === "ar";
  const [added, setAdded] = useState(false);
  const source = product.images?.[0] || "photo-1470770841072-f978cf4d019e";
  const image = imageUrl(source, 1600, demo.media);
  const name = ar ? (product.name_ar || product.name_en) : product.name_en;
  const description = ar ? (product.description_ar || product.description_en) : product.description_en;
  const category = ar ? (product.category?.name_ar || product.category?.name_en || "متجر الرحلات") : (product.category?.name_en || "FIELD SHOP");
  return <main className="detail-page shop-detail" dir={ar ? "rtl" : "ltr"}>
    <Link href="/shop" className="back-link">← {ar ? "متجر الرحلات" : "Field shop"}</Link>
    <div className="product-detail-grid"><img src={image} alt={name} /><div><p className="eyebrow">{category} <i /></p><h1>{name}</h1><p>{description}</p><strong className="product-detail-price">{ar ? "ج.م" : (product.currency || "EGP")} {Number(product.price).toLocaleString(ar ? "ar-EG" : "en-EG")}</strong>{product.preview && <p className="preview-disclaimer">{ar ? "معاينة توضيحية · ليست عرضًا مباشرًا" : "Illustrative preview · not a live offer"}</p>}<button className="button button-dark" onClick={() => { addToCart({ ...product, image, image_source: source }); setAdded(true); }}>{added ? (ar ? "أُضيف إلى الحقيبة" : "Added to bag") : (ar ? "أضف إلى الحقيبة" : "Add to bag")} ↗</button>{added && <p role="status"><Link href="/cart">{ar ? "اعرض الحقيبة ↗" : "View bag ↗"}</Link></p>}</div></div>
  </main>;
}
