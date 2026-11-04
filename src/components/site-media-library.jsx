"use client";

import { useState } from "react";
import { getMediaEntries } from "../data/media-library";
import { imageUrl } from "../data/content";
import { useSite } from "./site-context";

export default function SiteMediaLibrary({ assets = [] }) {
  const { demo, updateDemo } = useSite();
  const [notice, setNotice] = useState("");
  const entries = getMediaEntries(demo).filter((entry) => entry.group !== "Shop");
  for (const asset of assets) {
    if (asset.source && asset.group !== "Shop" && !entries.some((entry) => entry.key === asset.source)) entries.push(asset);
  }
  function save(key, value, source) {
    updateDemo((current) => {
      const media = { ...current.media };
      if (!value.trim() || value.trim() === source) delete media[key];
      else media[key] = value.trim();
      return { ...current, media };
    });
    setNotice("Image override saved in this browser.");
  }
  async function upload(event, asset) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12 * 1024 * 1024) {
      setNotice("Choose a JPG, PNG, or WebP image smaller than 12 MB."); event.target.value = ""; return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / bitmap.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Image conversion failed.")), "image/webp", .82));
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("Image could not be read.")); reader.readAsDataURL(blob); });
      updateDemo((current) => ({ ...current, media: { ...current.media, [asset.key]: data } }));
      setNotice(`${asset.label} uploaded and saved in this browser.`);
    } catch (error) { setNotice(error.message || "Image upload failed."); }
    finally { event.target.value = ""; }
  }
  return <section className="account-panel site-media-library">
    <div className="page-intro admin-subhead"><p className="eyebrow">VISUAL ASSETS <i/></p><h2>Images & backgrounds</h2><p>Replace storefront photography and the logo. Uploads and URL changes apply to matching image uses and stay in this browser.</p></div>
    {notice && <p role="status" className="form-message">{notice}</p>}
    <div className="media-library-grid">{entries.map((asset) => {
      const current = demo.media?.[asset.key] || asset.source;
      return <article className="media-library-card" key={asset.key}>
        <div className="media-library-preview"><img src={imageUrl(asset.source, 460, demo.media)} alt="" loading="lazy"/><span>{asset.group}</span></div>
        <div className="media-library-info"><h3>{asset.label}</h3><small>{asset.source.startsWith("photo-") ? "Unsplash image" : asset.source.startsWith("/") ? "Local site asset" : "Site image"}</small>
          {asset.locked ? <p className="preview-disclaimer">Geographic base map; destination points use real coordinates.</p> : <><label>Image URL or asset path<input type="text" key={`${asset.key}:${current}`} defaultValue={current} onBlur={(event) => save(asset.key, event.target.value, asset.source)} aria-label={`Image URL for ${asset.label}`}/></label><div className="media-library-actions"><label className="media-upload-button">Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event, asset)}/></label><button type="button" onClick={() => save(asset.key, "", asset.source)}>Restore original</button></div></>}
        </div>
      </article>;
    })}</div>
    <p className="preview-disclaimer">This admin image editor stores overrides in local browser storage. Production media uploads require a configured authenticated storage bucket.</p>
  </section>;
}
