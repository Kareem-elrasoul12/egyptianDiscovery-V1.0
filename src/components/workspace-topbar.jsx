"use client";

import { useSite } from "./site-context";

export default function WorkspaceTopbar() {
  const { lang } = useSite();
  const arabic = lang === "ar";
  return <div className="workspace-topbar" dir={arabic ? "rtl" : "ltr"}>
    <div><span className="workspace-kicker">{arabic ? "مصر كما تحبها" : "YOUR EGYPT, YOUR WAY"}</span><strong>{arabic ? "خطط لرحلة تبقى في الذاكرة." : "Plan something memorable."}</strong></div>
  </div>;
}
