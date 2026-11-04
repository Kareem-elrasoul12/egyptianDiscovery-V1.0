"use client";

import { useState } from "react";
import { TripCard } from "./cards";
import { useSite } from "./site-context";
import {isDemoMode} from "../lib/supabase/config";

export default function TripsExplorer({trips}) {
  const { t, lang, demo } = useSite();
  const [filter,setFilter] = useState("all");
  const filters = [["all","filterAll"],["Day trip","filterDay"],["Weekend","filterWeekend"],["Multi-day","filterMulti"]];
  const catalogue=isDemoMode()?demo.trips.map(item=>({...item,preview:true})):trips;
  const filtered=catalogue.filter(item=>filter==="all"||item.type===filter);
  return <main className="listing-page"><div className="page-intro"><p className="eyebrow">{t("upcoming")} <i/></p><h1>{t("tripsTitle")}</h1><p>{t("tripsText")}</p></div>{catalogue.some(x=>x.preview)&&<div className="notice-strip"><b>Interactive demo journeys</b><span>Try a 12-hour hold, submit sample transfer proof, then review it in the demo admin workspace. Prices and departures are illustrative.</span></div>}<div className="filter-row">{filters.map(([value,label])=><button key={value} className={`filter-chip ${filter===value?"active":""}`} onClick={()=>setFilter(value)}>{t(label)}</button>)}</div><div className="trip-grid listing-grid">{filtered.length?filtered.map(item=><TripCard key={item.id} item={item} lang={lang}/>):<p>{t("noTrips")}</p>}</div></main>;
}
