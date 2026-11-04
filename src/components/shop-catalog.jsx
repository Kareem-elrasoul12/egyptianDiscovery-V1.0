"use client";

import Link from "next/link";
import { useState } from "react";
import { useSite } from "./site-context";
import { imageUrl } from "../data/content";
import { isDemoMode } from "../lib/supabase/config";

function photo(product, media) {
  const source = product.images?.[0] || "photo-1470770841072-f978cf4d019e";
  return imageUrl(source, 900, media);
}

export default function ShopCatalog({ products, initialQuery = "" }) {
  const { lang, addToCart, demo } = useSite();
  const ar = lang === "ar";
  const [added, setAdded] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const catalogue = isDemoMode() ? demo.products.map(product => ({ ...product, preview: true })) : products;
  const filtered = catalogue.filter(product => `${product.name_en || ""} ${product.name_ar || ""} ${product.description_en || ""} ${product.description_ar || ""} ${product.category?.name_en || ""} ${product.category?.name_ar || ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  return <main className="listing-page" dir={ar ? "rtl" : "ltr"}>
    <div className="page-intro"><p className="eyebrow">{ar ? "اختيارات للطريق" : "MADE FOR THE WAY OUT THERE"} <i /></p><h1>{ar ? "أشياء نافعة للرحلة." : "Useful things for the journey."}</h1><p>{ar ? "مستلزمات سفر واختيارات مدروسة مستوحاة من طبيعة مصر وحرفها." : "Travel essentials and thoughtful finds inspired by Egypt’s landscapes and makers."}</p></div>
    {catalogue.some(product => product.preview) && <div className="notice-strip"><b>{ar ? "متجر تجريبي تفاعلي" : "Interactive demo shop"}</b><span>{ar ? "أضف منتجات إلى حقيبتك، وأكمل طلبًا تجريبيًا، ثم راجع حالته من لوحة الإدارة." : "Add items to your bag, place a sample order, submit transfer proof, and move it through fulfillment in the admin workspace."}</span></div>}
    <label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder={ar ? "ابحث في المتجر" : "Search the field shop"} aria-label={ar ? "ابحث في المنتجات" : "Search products"} /><kbd>↵</kbd></label>
    <div className="product-grid">{filtered.map(product => {
      const source = product.images?.[0] || "photo-1470770841072-f978cf4d019e";
      const image = photo(product, demo.media);
      const name = ar ? (product.name_ar || product.name_en) : product.name_en;
      const category = ar ? (product.category?.name_ar || product.category?.name_en || "المتجر") : (product.category?.name_en || "Field shop");
      return <article className="product-card" key={product.id}>
        <Link href={`/shop/${product.id}`} className="product-photo"><img src={image} alt={name} /><span>{category}</span></Link>
        <div className="product-card-info"><div><h2>{name}</h2><p>{ar ? (product.description_ar || product.description_en) : product.description_en}</p></div>
          <div className="product-buy"><strong>{ar ? "ج.م" : (product.currency || "EGP")} {Number(product.price).toLocaleString(ar ? "ar-EG" : "en-EG")}</strong><button aria-label={ar ? `أضف ${name} إلى الحقيبة` : `Add ${name} to bag`} onClick={() => { addToCart({ ...product, image, image_source: source }); setAdded(product.id); }}>＋</button></div>
          {added === product.id && <small role="status">{ar ? "أُضيف إلى الحقيبة" : "Added to your bag"}</small>}
        </div>
      </article>;
    })}</div>
    {!filtered.length && <p className="empty-state">{ar ? "لا توجد منتجات تطابق بحثك حاليًا." : "No products match your search right now."}</p>}
  </main>;
}
