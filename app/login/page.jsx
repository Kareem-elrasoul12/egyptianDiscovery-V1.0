"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../src/lib/supabase/client";
import { isDemoMode, isSupabaseConfigured } from "../../src/lib/supabase/config";
import { useSite } from "../../src/components/site-context";

export default function LoginPage() {
  const { lang } = useSite();
  const router = useRouter();
  const ar = lang === "ar";
  const tr = (en, arabic) => (ar ? arabic : en);

  const [tab, setTab] = useState("email"); // "email" | "phone"
  const [isRegister, setIsRegister] = useState(false);

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Phone form state
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);

  const [referralCode, setReferralCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleEmailAuth(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Database client not configured.");

      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim(),
              referral_code: referralCode.trim().toUpperCase() || null,
            },
          },
        });
        if (error) throw error;

        setMessage(
          tr(
            "Account created! You are now signed in.",
            "تم إنشاء الحساب بنجاح! تم تسجيل دخولك الآن."
          )
        );
        setTimeout(() => {
          window.location.assign("/account");
        }, 800);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        // Check if user is admin to redirect conveniently
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        if (["admin", "main_admin"].includes(profile?.role)) {
          window.location.assign("/admin");
        } else {
          window.location.assign("/account");
        }
      }
    } catch (error) {
      setMessage(
        ar
          ? "تعذر تسجيل الدخول بالبريد الإلكتروني. يرجى التحقق من صحة البيانات."
          : (error.message || "Email authentication failed. Please check your credentials.")
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePhoneAuth(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Database client not configured.");

      const result = sent
        ? await supabase.auth.verifyOtp({ phone: phone.trim(), token: code.trim(), type: "sms" })
        : await supabase.auth.signInWithOtp({
            phone: phone.trim(),
            options: {
              shouldCreateUser: true,
              data: { referral_code: referralCode.trim().toUpperCase() || null },
            },
          });

      if (result.error) throw result.error;

      if (sent) {
        window.location.assign("/account");
      } else {
        setSent(true);
        setMessage(
          tr(
            "Enter the verification code sent to your phone via SMS.",
            "أدخل رمز التحقق المرسل إلى هاتفك عبر رسالة قصيرة."
          )
        );
      }
    } catch (error) {
      setMessage(
        ar
          ? "تعذر إرسال الرمز لرقم الهاتف. يرجى استخدام تسجيل الدخول بالبريد الإلكتروني أو المحاولة لاحقًا."
          : (error.message || "Phone authentication failed. Please try Email login instead.")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="listing-page auth-page" dir={ar ? "rtl" : "ltr"}>
      <div className="auth-card">
        <p className="eyebrow">
          {tr("YOUR NEXT STORY STARTS HERE", "حكايتك القادمة تبدأ هنا")} <i />
        </p>
        <h1>{tr("Welcome, explorer.", "أهلًا بك، أيها المستكشف.")}</h1>
        <p>
          {tr(
            "Sign in to manage your bookings, traveler details, payments, and rewards.",
            "سجّل الدخول لمتابعة حجوزاتك وبيانات المسافرين والمدفوعات والمكافآت."
          )}
        </p>

        {!isSupabaseConfigured() ? (
          isDemoMode() ? (
            <div className="setup-notice">
              <strong>{tr("Local demo mode", "وضع تجريبي محلي")}</strong>
              <p>
                {tr(
                  "Sample interactions are enabled for this development preview only.",
                  "التفاعلات التجريبية مفعلة في هذه المعاينة فقط."
                )}
              </p>
              <Link className="button button-dark" href="/account">
                {tr("Continue to demo account ↗", "متابعة إلى الحساب التجريبي ↗")}
              </Link>
              <p>
                <Link href="/admin">
                  {tr("Open demo admin ↗", "افتح لوحة الإدارة التجريبية ↗")}
                </Link>
              </p>
            </div>
          ) : (
            <div className="setup-notice">
              <strong>{tr("Service is not connected", "الخدمة غير متصلة")}</strong>
              <p>
                {tr(
                  "Database configuration is required before signing in.",
                  "يرجى إعداد بيانات قاعدة البيانات قبل تسجيل الدخول."
                )}
              </p>
            </div>
          )
        ) : (
          <div>
            <div className="filter-row" style={{ marginTop: "14px", marginBottom: "16px" }}>
              <button
                type="button"
                className={`filter-chip ${tab === "email" ? "active" : ""}`}
                onClick={() => { setTab("email"); setMessage(""); }}
              >
                {tr("Email & Password", "البريد الإلكتروني وكلمة المرور")}
              </button>
              <button
                type="button"
                className={`filter-chip ${tab === "phone" ? "active" : ""}`}
                onClick={() => { setTab("phone"); setMessage(""); }}
              >
                {tr("Phone Number (SMS)", "رقم الهاتف")}
              </button>
            </div>

            {tab === "email" ? (
              <form onSubmit={handleEmailAuth} className="stack-form">
                {isRegister && (
                  <label>
                    {tr("Full name", "الاسم بالكامل")}
                    <input
                      type="text"
                      required
                      placeholder={tr("Your name", "اسمك الكريم")}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </label>
                )}

                <label>
                  {tr("Email address", "البريد الإلكتروني")}
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="explorer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label>
                  {tr("Password", "كلمة المرور")}
                  <input
                    type="password"
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>

                {isRegister && (
                  <label>
                    {tr("Referral code (optional)", "رمز الإحالة (اختياري)")}
                    <input
                      autoCapitalize="characters"
                      maxLength={10}
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                    />
                  </label>
                )}

                <button className="button button-dark" disabled={busy}>
                  {busy
                    ? tr("Please wait…", "يرجى الانتظار…")
                    : isRegister
                    ? tr("Create account ↗", "إنشاء حساب جديد ↗")
                    : tr("Sign in ↗", "تسجيل الدخول ↗")}
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "11px" }}>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "var(--olive)", fontWeight: 750, padding: 0 }}
                    onClick={() => { setIsRegister(!isRegister); setMessage(""); }}
                  >
                    {isRegister
                      ? tr("Already have an account? Sign In", "لديك حساب بالفعل؟ سجّل الدخول")
                      : tr("Don't have an account? Create one", "ليس لديك حساب؟ أنشئ حسابًا جديدًا")}
                  </button>
                </div>

                {message && <p role="status" className="form-message">{message}</p>}
              </form>
            ) : (
              <form onSubmit={handlePhoneAuth} className="stack-form">
                <label>
                  {tr("Mobile number", "رقم الهاتف")}
                  <input
                    type="tel"
                    autoComplete="tel"
                    required
                    placeholder="+20 10 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>

                {!sent && (
                  <label>
                    {tr("Referral code (optional)", "رمز الإحالة (اختياري)")}
                    <input
                      autoCapitalize="characters"
                      maxLength={10}
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                    />
                  </label>
                )}

                {sent && (
                  <label>
                    {tr("Verification code", "رمز التحقق")}
                    <input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </label>
                )}

                <button className="button button-dark" disabled={busy}>
                  {busy
                    ? tr("Please wait…", "يرجى الانتظار…")
                    : sent
                    ? tr("Verify and sign in", "تحقق وسجّل الدخول")
                    : tr("Send code", "أرسل الرمز")} <span>↗</span>
                </button>

                {message && <p role="status" className="form-message">{message}</p>}
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
