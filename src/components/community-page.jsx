"use client";

import Link from "next/link";
import { useSite } from "./site-context";

export default function CommunityPageContent({ members = [], reviews = [] }) {
  const { lang } = useSite();
  const ar = lang === "ar";
  return <main className="listing-page" dir={ar ? "rtl" : "ltr"}>
    <div className="page-intro"><p className="eyebrow">{ar ? "الرفاق الذين نلتقي بهم في الطريق" : "THE PEOPLE YOU MEET ALONG THE WAY"} <i /></p><h1>{ar ? "رحلات طيبة تفتح آفاقًا أوسع." : "Good journeys travel further."}</h1><p>{ar ? "إنجازات المسافرين وحكاياتهم وتفاصيل صغيرة تجعل الرحلة القادمة أجمل." : "Member milestones, shared stories, and the small things that make the next trip better."}</p></div>
    <div className="account-grid">
      <section className="account-panel"><h2>{ar ? "مستكشفو هذا الشهر" : "This month’s explorers"}</h2>{members.length ? <div className="leaderboard">{members.map(member => <article className="leaderboard-row" key={member.profile_id}><b>#{member.rank}</b><strong>{member.display_name}</strong><span>{member.points} {ar ? "نقطة" : "points"}</span></article>)}</div> : <p>{ar ? "سيظهر ترتيب المستكشفين بعد أن يشارك الأعضاء في رحلات مؤكدة وأنشطة مؤهلة. لا نعرض نتائج وهمية." : "Leaderboard results appear here once members earn points through confirmed trips and other qualifying activities. No preview scores are shown."}</p>}<p className="small-note">{ar ? "تُكتسب النقاط عبر الأنشطة المؤهلة، ويمكن للمشرفين تعديل نظام النقاط والمكافآت." : "Points are earned for completed qualifying activities. Admins can adjust scoring and rewards."}</p></section>
      <section className="account-panel"><h2>{ar ? "حكايات المسافرين" : "Traveler notes"}</h2>{reviews.length ? reviews.map(review => <article className="review-row" key={review.id}><div className="stars">{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</div><strong>{review.display_name || (ar ? "مسافر" : "Explorer")}</strong><p>{ar ? (review.review_ar || review.review_en) : review.review_en}</p><small>{ar ? (review.trip_name_ar || review.trip_name_en) : review.trip_name_en}</small></article>) : <p>{ar ? "ستظهر آراء المسافرين بعد رحلة مؤكدة وموافقة الفريق. لا نستخدم شهادات تجريبية." : "Verified traveler reviews will appear after a confirmed trip. We do not use placeholder testimonials."}</p>}</section>
    </div>
    <section className="account-panel"><h2>{ar ? "ادعُ رفيقًا للرحلة" : "Invite a travel companion"}</h2><p>{ar ? "سجّل الدخول للاطلاع على رمز الإحالة الخاص بك. تُضاف المكافأة بعد إكمال المسافر المُحال لحجز مؤهل." : "Sign in to find your personal referral code. Referral rewards are applied after the referred traveler completes a qualifying booking, with duplicate rewards prevented."}</p><Link className="button button-dark" href="/account">{ar ? "اعرض رمز الإحالة ↗" : "View your referral code ↗"}</Link></section>
  </main>;
}
