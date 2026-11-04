"use client";

import { useSite } from "./site-context";

export default function SignOutButton({ className = "button button-dark", text }) {
  const { signOut, lang } = useSite();
  const ar = lang === "ar";
  return (
    <button type="button" className={className} onClick={signOut} aria-label={ar ? "تسجيل الخروج" : "Log out"}>
      {text || (ar ? "تسجيل الخروج" : "Log out")} <span style={{ marginLeft: "4px" }}>↳</span>
    </button>
  );
}
