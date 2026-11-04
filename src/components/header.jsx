"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSite } from "./site-context";

export function Header() {
  const { t, lang, theme, toggleLanguage, toggleTheme, cart, demo, currentUser, currentProfile, isAdmin, signOut } = useSite();
  const pathname = usePathname();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const ar = lang === "ar";

  const links = [
    ["/", "home"],
    ["/destinations", "destinations"],
    ["/trips", "trips"],
    ["/shop", "shop"],
    ["/community", "community"],
    ["/gallery", "gallery"],
    ["/about", "about"],
    ["/#contact", "contact"],
  ];

  return (
    <header className="header" dir={ar ? "rtl" : "ltr"}>
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Egyptian Discovery home" onClick={() => setMenuOpen(false)}>
          <img src={demo.media?.["brand-logo"] || "/logo-transparent.png"} alt="Egyptian Discovery" />
          <span>
            EGYPTIAN<br />
            <b>DISCOVERY</b>
          </span>
        </Link>

        <nav className={`nav ${menuOpen ? "open" : ""}`} aria-label={ar ? "القائمة الرئيسية" : "Main navigation"}>
          {links.map(([href, key]) => (
            <Link
              key={key}
              href={href}
              aria-current={href === pathname ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {t(key)}
            </Link>
          ))}

          {/* Mobile-only action items */}
          <div className="mobile-nav-actions">
            {isAdmin && (
              <Link href="/admin" className="admin-pill-link" onClick={() => setMenuOpen(false)}>
                ⚡ {ar ? "لوحة الإدارة" : "Admin Panel"}
              </Link>
            )}
            {currentUser ? (
              <>
                <Link href="/account" className="account-pill-link" onClick={() => setMenuOpen(false)}>
                  👤 {ar ? "حسابي" : "My Account"}
                </Link>
                <button type="button" className="logout-pill-link" onClick={() => { signOut(); setMenuOpen(false); }}>
                  ↳ {ar ? "تسجيل الخروج" : "Log out"}
                </button>
              </>
            ) : (
              <Link href="/login" className="login-pill-link" onClick={() => setMenuOpen(false)}>
                → {ar ? "تسجيل الدخول" : "Sign in"}
              </Link>
            )}
          </div>
        </nav>

        <div className="header-actions">
          {/* Admin badge link if admin */}
          {isAdmin && (
            <Link href="/admin" className="admin-nav-button" title={ar ? "لوحة الإدارة" : "Operations Dashboard"}>
              <span className="admin-dot" />
              <span>{ar ? "لوحة الإدارة" : "Admin"}</span>
            </Link>
          )}

          {/* Cart */}
          <Link href="/cart" className="cart-link" aria-label={ar ? `حقيبة التسوق، ${cartCount} عناصر` : `Shopping bag, ${cartCount} items`}>
            <svg className="cart-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 8h14l1 12H4L5 8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <span className="cart-label">{ar ? "الحقيبة" : "Bag"}</span>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </Link>

          {/* Customer / Admin Account */}
          {currentUser ? (
            <Link href="/account" className="account-link" aria-label={ar ? "حساب المسافر" : "Customer account"}>
              <svg className="account-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
                <path d="M5.5 20c.6-3.4 2.7-5.2 6.5-5.2s5.9 1.8 6.5 5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <span>{ar ? "حسابي" : "Account"}</span>
            </Link>
          ) : (
            <Link href="/login" className="account-link" aria-label={ar ? "تسجيل الدخول" : "Sign in"}>
              <span>{ar ? "دخول" : "Sign in"}</span>
            </Link>
          )}

          {/* Log Out button if user is signed in */}
          {currentUser && (
            <button
              type="button"
              className="icon-button logout-button"
              onClick={signOut}
              title={ar ? "تسجيل الخروج" : "Log out"}
              aria-label={ar ? "تسجيل الخروج" : "Log out"}
            >
              <span style={{ fontSize: "12px", fontWeight: "bold" }}>↳</span>
            </button>
          )}

          {/* Theme & Language */}
          <button className="icon-button" onClick={toggleTheme} aria-label={ar ? "تغيير المظهر" : "Toggle color theme"}>
            {theme === "light" ? "☾" : "☼"}
          </button>
          <button className="lang-button" onClick={toggleLanguage} aria-label={ar ? "تغيير اللغة" : "Switch language"}>
            {ar ? "EN" : "عربي"}
          </button>

          {/* CTA */}
          <Link href="/trips" className="header-cta">
            {t("discover")} <span>↗</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? (ar ? "إغلاق القائمة" : "Close menu") : (ar ? "فتح القائمة" : "Open menu")}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
