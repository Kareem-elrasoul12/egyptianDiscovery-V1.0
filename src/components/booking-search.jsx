"use client";

import { useState } from "react";
import { useSite } from "./site-context";

export default function BookingSearch({ destinations = [] }) {
  const { lang } = useSite();
  const ar = lang === "ar";
  const [kind, setKind] = useState("trips");
  const [place, setPlace] = useState("");
  const [term, setTerm] = useState("");
  const submit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (place) params.set("place", place);
    if (term.trim()) params.set("q", term.trim());
    window.location.assign(`/${kind}${params.size ? `?${params}` : ""}`);
  };
  return <section className="booking-panel" aria-label={ar?"ابحث عن رحلة أو وجهة":"Find a trip or destination"} dir={ar?"rtl":"ltr"}>
    <div className="booking-panel-heading"><div><span className="workspace-kicker">{ar?"ابدأ باختيار مكان":"START WITH A PLACE"}</span><h2>{ar?"إلى أين تأخذك مصر؟":"Where will Egypt take you?"}</h2></div><span className="booking-ornament" aria-hidden="true">✳</span></div>
    <div className="booking-tabs" role="tablist" aria-label={ar?"نوع البحث":"Search category"}>{[["trips",ar?"الرحلات":"Trips"],["destinations",ar?"الوجهات":"Destinations"]].map(([value,label])=><button type="button" role="tab" aria-selected={kind===value} className={kind===value?"active":""} key={value} onClick={()=>setKind(value)}>{label}</button>)}</div>
    <form className="booking-fields" onSubmit={submit}>
      <label className="booking-place"><span>{ar?"الوجهة":"DESTINATION"}</span><select value={place} onChange={event=>setPlace(event.target.value)}><option value="">{ar?"أي مكان في مصر":"Anywhere in Egypt"}</option>{destinations.map(item=><option key={item.id} value={item.id}>{ar?(item.ar||item.name_ar):(item.name||item.name_en)}</option>)}</select></label>
      <label className="booking-query"><span>{kind==="trips"?(ar?"ما نوع الرحلة؟":"WHAT KIND OF TRIP?"):(ar?"ابحث في الوجهات":"SEARCH DESTINATIONS")}</span><input value={term} onChange={event=>setTerm(event.target.value)} placeholder={kind==="trips"?(ar?"صحراء، مشي، عطلة نهاية الأسبوع…":"Desert, hiking, weekend…"):(ar?"جرّب سيوة، سيناء، القاهرة…":"Try Siwa, Sinai, Cairo…")}/></label>
      <button className="booking-submit" type="submit"><span>{ar?"استكشف":"Explore"}</span><b aria-hidden="true">↗</b></button>
    </form><p className="booking-note">{ar?"مجموعات صغيرة · خبرة محلية · مساحة للاستكشاف":"Small groups · Local knowledge · Space to explore"}</p>
  </section>;
}
