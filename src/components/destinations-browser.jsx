"use client";

import { useMemo, useState } from "react";
import { DestinationCard } from "./cards";
import { useSite } from "./site-context";
import { isDemoMode } from "../lib/supabase/config";

export default function DestinationsBrowser({ liveDestinations = null }) {
  const { t, lang, demo } = useSite();
  const [query, setQuery] = useState("");
  const destinations = isDemoMode() ? demo.destinations : (liveDestinations || []);
  const filtered = useMemo(() => destinations.filter((item) => `${item.name || item.name_en} ${item.ar || item.name_ar} ${item.region || item.region_en} ${item.regionAr || item.region_ar}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [destinations, query]);
  return <main className="listing-page"><div className="page-intro"><p className="eyebrow">{t("journeys")} <i/></p><h1>{t("destinationsTitle")}</h1><p>{t("destinationsText")}</p></div><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")}/><kbd>↵</kbd></label><div className="destination-grid listing-grid">{filtered.map((item) => <DestinationCard key={item.id} item={item} lang={lang}/>)}</div></main>;
}
