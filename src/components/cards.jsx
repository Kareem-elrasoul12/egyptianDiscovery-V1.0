"use client";

import Link from "next/link";
import { imageUrl } from "../data/content";
import { useSite } from "./site-context";

const photo=(value,width,media)=>imageUrl(value,width,media);

export function DestinationCard({ item, lang }) {
  const {demo}=useSite();
  return <Link className="destination-card" href={`/destinations/${item.id}`}><img src={photo(item.image, 800,demo.media)} alt={lang === "ar" ? item.ar : item.name} loading="lazy"/><span className="card-shade"/><span className="destination-meta"><small>{lang === "ar" ? item.regionAr : item.region}</small><strong>{lang === "ar" ? item.ar : item.name}</strong><span className="card-arrow">↗</span></span></Link>;
}

export function TripCard({ item, lang }) {
  const {demo}=useSite();
  return <Link className="trip-card" href={`/trips/${item.id}`}><div className="trip-image"><img src={photo(item.image, 900,demo.media)} alt={item.name} loading="lazy"/><span className="trip-type">{lang === "ar" ? item.typeAr : item.type}</span>{item.preview&&<span className="demo-label">SAMPLE PREVIEW</span>}</div><div className="trip-info"><div className="trip-place">{lang === "ar" ? item.placeAr : item.place}<span>·</span>{lang === "ar" ? item.durationAr : item.duration}</div><h3>{lang === "ar" ? item.ar : item.name}</h3><div className="trip-note">{lang === "ar" ? item.noteAr : item.note}</div><div className="trip-bottom"><span>{lang === "ar" ? item.dateAr : item.date}</span><strong>{item.price}</strong></div>{item.preview&&<small className="preview-disclaimer">Illustrative sample · not live availability or a confirmed price</small>}</div></Link>;
}
