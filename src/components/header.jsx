"use client";

import Link from "next/link";
import { useState } from "react";
import { useSite } from "./site-context";

export function Header() {
  const { t, lang, theme, toggleLanguage, toggleTheme, cart, demo } = useSite();
  const cartCount = cart.reduce((sum,item)=>sum+item.quantity,0);
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [["/", "home"], ["/destinations", "destinations"], ["/trips", "trips"], ["/shop", "shop"], ["/community", "Community"], ["/gallery", "Gallery"], ["/about", "about"], ["/#contact", "contact"]];
  return <header className="header">
    <Link className="brand" href="/" aria-label="Egyptian Discovery home"><img src={demo.media?.["brand-logo"]||"/logo-transparent.png"} alt=""/><span>EGYPTIAN<br/><b>DISCOVERY</b></span></Link>
    <nav className={`nav ${menuOpen ? "open" : ""}`} aria-label="Main navigation">{links.map(([href,key]) => <Link key={key} href={href} onClick={() => setMenuOpen(false)}>{t(key)}</Link>)}</nav>
    <div className="header-actions"><Link href="/cart" className="cart-link" aria-label={`Shopping bag, ${cartCount} items`}><svg className="cart-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 8h14l1 12H4L5 8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg><span className="cart-label">Bag</span><span className="cart-count">{cartCount}</span></Link><Link href="/account" className="account-link" aria-label="Customer account"><svg className="account-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7"/><path d="M5.5 20c.6-3.4 2.7-5.2 6.5-5.2s5.9 1.8 6.5 5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg><span>Account</span></Link><button className="icon-button" onClick={toggleTheme} aria-label="Toggle color theme">{theme === "light" ? "☾" : "☼"}</button><button className="lang-button" onClick={toggleLanguage} aria-label="Switch language">{lang === "ar" ? "EN" : "عربي"}</button><Link href="/trips" className="header-cta">{t("discover")} <span>↗</span></Link><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}><span/><span/></button></div>
  </header>;
}
