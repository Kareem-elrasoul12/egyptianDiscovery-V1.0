"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../src/lib/supabase/client";
import { isDemoMode, isSupabaseConfigured } from "../../src/lib/supabase/config";
import { useSite } from "../../src/components/site-context";

export default function LoginPage() {
  const {lang}=useSite();
  const ar=lang==="ar";
  const tr=(en,arabic)=>ar?arabic:en;
  const [phone,setPhone] = useState("");
  const [code,setCode] = useState("");
  const [referralCode,setReferralCode] = useState("");
  const [sent,setSent] = useState(false);
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const result = sent
        ? await supabase.auth.verifyOtp({ phone, token: code, type: "sms" })
        : await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: true, data: { referral_code: referralCode.trim().toUpperCase() || null } } });
      if (result.error) throw result.error;
      if (sent) window.location.assign("/account");
      else { setSent(true); setMessage(tr("Enter the verification code sent to your phone.","أدخل رمز التحقق الذي أُرسل إلى هاتفك.")); }
    } catch (error) { setMessage(ar?"تعذر تسجيل الدخول برقم الهاتف. حاول مرة أخرى.":(error.message || "Phone sign-in could not be completed.")); }
    finally { setBusy(false); }
  }
  return <main className="listing-page auth-page" dir={ar?"rtl":"ltr"}><div className="auth-card"><p className="eyebrow">{tr("YOUR NEXT STORY STARTS HERE","حكايتك القادمة تبدأ هنا")} <i/></p><h1>{tr("Welcome, explorer.","أهلًا بك، أيها المستكشف.")}</h1><p>{tr("Sign in with your phone number to manage reservations, traveler details, and rewards.","سجّل الدخول برقم هاتفك لإدارة الحجوزات وبيانات المسافرين والمكافآت.")}</p>{!isSupabaseConfigured() ? (isDemoMode()?<div className="setup-notice"><strong>{tr("Local demo mode","وضع تجريبي محلي")}</strong><p>{tr("Sample interactions are enabled for this development preview only.","التفاعلات التجريبية مفعلة في هذه المعاينة فقط.")}</p><Link className="button button-dark" href="/account">{tr("Continue to demo account ↗","متابعة إلى الحساب التجريبي ↗")}</Link><p><Link href="/admin">{tr("Open demo admin ↗","افتح لوحة الإدارة التجريبية ↗")}</Link></p></div>:<div className="setup-notice"><strong>{tr("Sign-in service is not connected","خدمة تسجيل الدخول غير متصلة")}</strong><p>{tr("Configure Supabase URL, publishable key, and phone authentication before enabling customer sign-in.","أعِد إعداد رابط Supabase ومفتاح النشر والمصادقة الهاتفية لتفعيل تسجيل دخول العملاء.")}</p></div>) : <form onSubmit={submit} className="stack-form"><label>{tr("Mobile number","رقم الهاتف")}<input type="tel" autoComplete="tel" required placeholder="+20 10 1234 5678" value={phone} onChange={e=>setPhone(e.target.value)}/></label>{!sent&&<label>{tr("Referral code (optional)","رمز الإحالة (اختياري)")}<input autoCapitalize="characters" maxLength="10" value={referralCode} onChange={e=>setReferralCode(e.target.value)}/></label>}{sent&&<label>{tr("Verification code","رمز التحقق")}<input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={e=>setCode(e.target.value)} /></label>}<button className="button button-dark" disabled={busy}>{busy?tr("Please wait…","يرجى الانتظار…"):sent?tr("Verify and sign in","تحقق وسجّل الدخول"):tr("Send code","أرسل الرمز")} <span>↗</span></button>{message&&<p role="status" className="form-message">{message}</p>}</form>}</div></main>;
}
