"use client";

import Link from "next/link";
import { TripCard } from "./cards";
import { imageUrl } from "../data/content";
import { useSite } from "./site-context";

export default function DestinationDetailClient({ slug, liveDestination = null, liveTrips = [] }) {
  const { t, lang, demo } = useSite();
  const place = liveDestination || demo.destinations.find((item) => item.id === slug || item.slug === slug);
  if (!place) return <main className="listing-page"><h1>Destination not found.</h1><Link className="back-link" href="/destinations">← {t("back")}</Link></main>;
  const name = place.name || place.name_en;
  const photos = place.images?.length ? place.images : [place.image || place.hero_image].filter(Boolean);
  const hero = place.image || place.hero_image || photos[0] || "photo-1509316785289-025f5b846b35";
  const related = liveDestination ? liveTrips : demo.trips.filter((trip) => trip.place === name || trip.place === place.region);
  const description = lang === "ar" ? (place.descAr || place.description_ar) : (place.description || place.description_en);
  return <main className="detail-page"><Link href="/destinations" className="back-link">← {t("back")}</Link><div className="detail-hero"><img src={imageUrl(hero, 1800, demo.media)} alt={lang === "ar" ? (place.ar || place.name_ar) : name}/><div><p className="eyebrow light">{lang === "ar" ? (place.regionAr || place.region_ar) : (place.region || place.region_en)}</p><h1>{lang === "ar" ? (place.ar || place.name_ar) : name}</h1>{description&&<p>{description}</p>}<Link href="/trips" className="button button-light">{t("viewTrips")} <span>↗</span></Link></div></div>
    {photos.filter((source) => source && source !== hero).length > 0 && <section className="destination-photo-gallery" aria-label={`${name} photos`}>{photos.filter((source) => source && source !== hero).map((source, index) => <img key={`${source}-${index}`} src={imageUrl(source, 1100, demo.media)} alt={`${name} photo ${index + 2}`} loading="lazy"/>)}</section>}
    <div className="detail-related"><p className="eyebrow">{t("upcoming")} <i/></p><h2>{t("tripsTitle")}</h2><div className="trip-grid">{related.length ? related.map((item) => <TripCard key={item.id} item={item} lang={lang}/>) : <p>{t("noTrips")}</p>}</div></div>
  </main>;
}
