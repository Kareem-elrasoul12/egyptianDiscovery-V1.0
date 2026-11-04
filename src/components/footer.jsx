"use client";

import Link from "next/link";
import { useSite } from "./site-context";

export function Footer() {
  const { t, demo } = useSite();
  return <footer className="footer" id="contact"><div className="footer-brand"><Link className="brand brand-footer" href="/"><img src={demo.media?.["brand-logo"]||"/logo-transparent.png"} alt=""/><span>EGYPTIAN<br/><b>DISCOVERY</b></span></Link><p>{t("footer")}</p></div><div className="footer-links"><Link href="/destinations">{t("destinations")}</Link><Link href="/trips">{t("trips")}</Link><Link href="/about">{t("about")}</Link><a href="https://wa.me/" target="_blank" rel="noreferrer">{t("contact")}</a></div><div className="footer-contact"><small>{t("contactText")}</small><a href="https://wa.me/" target="_blank" rel="noreferrer">WhatsApp ↗</a><a href="mailto:hello@egyptiandiscovery.com">hello@egyptiandiscovery.com</a></div><div className="footer-bottom"><span>{t("rights")}</span><span>EGYPT · 29°58′ N 31°08′ E</span></div></footer>;
}
