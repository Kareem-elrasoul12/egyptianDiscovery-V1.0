"use client";

import { imageUrl } from "../data/content";
import { useSite } from "./site-context";

export default function SiteProductImageLibrary({ products = [] }) {
  const { demo, updateDemo } = useSite();
  function save(key, source, value) {
    updateDemo((current) => {
      const media = { ...current.media };
      if (!value.trim() || value.trim() === source) delete media[key]; else media[key] = value.trim();
      return { ...current, media };
    });
  }
  async function upload(event, key, label) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12 * 1024 * 1024) { window.alert("Choose a JPG, PNG, or WebP image smaller than 12 MB."); event.target.value = ""; return; }
    try {
      const bitmap = await createImageBitmap(file); const scale = Math.min(1, 1600 / bitmap.width);
      const canvas = document.createElement("canvas"); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Conversion failed")), "image/webp", .82));
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
      updateDemo((current) => ({ ...current, media: { ...current.media, [key]: data } }));
    } catch { window.alert(`Could not process ${label}.`); }
    finally { event.target.value = ""; }
  }
  return <section className="account-panel site-product-images"><div className="page-intro admin-subhead"><p className="eyebrow">SHOP CATALOGUE <i/></p><h2>Product images</h2><p>These controls are grouped with shop management. Changes are saved as image overrides in this browser.</p></div>
    {!products.length ? <p>No products are available yet.</p> : <div className="media-library-grid">{products.flatMap((product) => (product.images || []).map((source, index) => {
      const key = source; const current = demo.media?.[key] || source; const label = `${product.name_en} photo ${index + 1}`;
      return <article className="media-library-card" key={`${product.id}:${index}`}><div className="media-library-preview"><img src={imageUrl(source, 460, demo.media)} alt="" loading="lazy"/><span>SHOP PRODUCT</span></div><div className="media-library-info"><h3>{product.name_en}</h3><label>Image URL or asset path<input type="text" key={`${key}:${current}`} defaultValue={current} onBlur={(event) => save(key, source, event.target.value)} aria-label={`Image URL for ${label}`}/></label><div className="media-library-actions"><label className="media-upload-button">Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event, key, label)}/></label><button type="button" onClick={() => save(key, source, "")}>Restore original</button></div></div></article>;
    }))}</div>}
  </section>;
}
