"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../src/lib/supabase/client";
import { isDemoMode, isSupabaseConfigured } from "../../src/lib/supabase/config";

export default function LoginPage() {
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
      else { setSent(true); setMessage("Enter the verification code sent to your phone."); }
    } catch (error) { setMessage(error.message || "Phone sign-in could not be completed."); }
    finally { setBusy(false); }
  }
  return <main className="listing-page auth-page"><div className="auth-card"><p className="eyebrow">YOUR NEXT STORY STARTS HERE <i/></p><h1>Welcome, explorer.</h1><p>Sign in with your phone number to manage reservations, traveler details, and rewards.</p>{!isSupabaseConfigured() ? (isDemoMode()?<div className="setup-notice"><strong>Local demo mode</strong><p>Sample interactions are enabled for this development preview only.</p><Link className="button button-dark" href="/account">Continue to demo account ↗</Link><p><Link href="/admin">Open demo admin ↗</Link></p></div>:<div className="setup-notice"><strong>Sign-in service is not connected</strong><p>Configure Supabase URL, publishable key, and phone authentication before enabling customer sign-in.</p></div>) : <form onSubmit={submit} className="stack-form"><label>Mobile number<input type="tel" autoComplete="tel" required placeholder="+20 10 1234 5678" value={phone} onChange={e=>setPhone(e.target.value)}/></label>{!sent&&<label>Referral code (optional)<input autoCapitalize="characters" maxLength="10" value={referralCode} onChange={e=>setReferralCode(e.target.value)}/></label>}{sent&&<label>Verification code<input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={e=>setCode(e.target.value)} /></label>}<button className="button button-dark" disabled={busy}>{busy?"Please wait…":sent?"Verify and sign in":"Send code"} <span>↗</span></button>{message&&<p role="status" className="form-message">{message}</p>}</form>}</div></main>;
}
