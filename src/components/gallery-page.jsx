"use client";

import { useSite } from "./site-context";
import GalleryGrid from "./gallery-grid";

export default function GalleryPageContent({ items = [] }) {
  const { lang } = useSite();
  const ar = lang === "ar";
  return <main className="listing-page" dir={ar ? "rtl" : "ltr"}>
    <div className="page-intro"><p className="eyebrow">{ar ? "معًا في رحاب الطبيعة" : "OUT THERE, TOGETHER"} <i /></p><h1>{ar ? "حكايات من الطريق." : "Notes from the field."}</h1><p>{ar ? "لحظات من الرحلات يشاركها فريق السفر ومجتمعنا." : "Moments from trips shared by the travel team and our community."}</p></div>
    {items.length ? <GalleryGrid items={items} /> : <div className="setup-notice wide-notice"><strong>{ar ? "معرض الرحلات جاهز للصور." : "The field gallery is ready for trip photos."}</strong><p>{ar ? "ستظهر الصور بعد أن يرفعها الفريق ويعتمدها. لا نعرض صورًا عامة على أنها تجارب سابقة للمسافرين." : "Gallery photos appear after the team uploads and approves them. No stock photos are presented as past customer trips."}</p></div>}
  </main>;
}
