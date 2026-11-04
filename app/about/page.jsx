"use client";

import { imageUrl } from "../../src/data/content";
import { useSite } from "../../src/components/site-context";

export default function AboutPage() {
  const { t, demo } = useSite();
  return <main className="listing-page about-page"><div className="page-intro"><p className="eyebrow">EGYPTIAN DISCOVERY <i/></p><h1>{t("aboutPage")}</h1><p>{t("aboutText")}</p></div><div className="about-photo"><img src={imageUrl("photo-1464278533981-50106e6176b1",1600,demo.media)} alt="Desert hills at sunset"/></div></main>;
}
