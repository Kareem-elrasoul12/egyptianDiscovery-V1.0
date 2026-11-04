"use client";

import { useState } from "react";
import { TripCard } from "./cards";
import { useSite } from "./site-context";
import {isDemoMode} from "../lib/supabase/config";

export default function TripsExplorer({trips, initialQuery = "", initialPlace = ""}) {
  const { t, lang, demo } = useSite();
  const [filter,setFilter] = useState("all");
  const filters = [["all","filterAll"],["Day trip","filterDay"],["Weekend","filterWeekend"],["Multi-day","filterMulti"]];
  const catalogue=isDemoMode()?demo.trips.map(item=>({...item,preview:true})):trips;
  const query=String(initialQuery||"").toLocaleLowerCase();
  const filtered=catalogue.filter(item=>(filter==="all"||item.type===filter)&&(!initialPlace||item.placeSlug===initialPlace||item.id===initialPlace)&&(!query||`${item.name} ${item.ar} ${item.place} ${item.type} ${item.note}`.toLocaleLowerCase().includes(query)));
  return <main className="listing-page" dir={lang==="ar"?"rtl":"ltr"}><div className="page-intro"><p className="eyebrow">{t("upcoming")} <i/></p><h1>{t("tripsTitle")}</h1><p>{t("tripsText")}</p></div>{catalogue.some(x=>x.preview)&&<div className="notice-strip"><b>{lang==="ar"?"رحلات تجريبية تفاعلية":"Interactive demo journeys"}</b><span>{lang==="ar"?"جرّب حجزًا مؤقتًا لمدة ١٢ ساعة، وأرسل إثبات تحويل تجريبيًا، ثم راجعه من لوحة الإدارة. الأسعار والمواعيد للتوضيح فقط.":"Try a 12-hour hold, submit sample transfer proof, then review it in the demo admin workspace. Prices and departures are illustrative."}</span></div>}<form className="search-box trip-search" action="/trips"><span>⌕</span><input name="q" defaultValue={initialQuery} placeholder={t("search")}/><button aria-label={lang==="ar"?"ابحث عن الرحلات":"Search trips"}>↵</button></form><div className="filter-row">{filters.map(([value,label])=><button key={value} className={`filter-chip ${filter===value?"active":""}`} onClick={()=>setFilter(value)}>{t(label)}</button>)}</div><div className="trip-grid listing-grid">{filtered.length?filtered.map(item=><TripCard key={item.id} item={item} lang={lang}/>):<p>{t("noTrips")}</p>}</div></main>;
}
