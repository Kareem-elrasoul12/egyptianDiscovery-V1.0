"use client";

import Link from "next/link";
import { useSite } from "../../src/components/site-context";
import { imageUrl } from "../../src/data/content";

export default function CartPage() {
  const { cart, setCartQuantity, removeFromCart, demo, lang } = useSite();
  const ar = lang === "ar";
  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const number = total.toLocaleString(ar ? "ar-EG" : "en-EG");
  return <main className="listing-page" dir={ar ? "rtl" : "ltr"}>
    <div className="page-intro"><p className="eyebrow">{ar ? "متجر الرحلات" : "FIELD SHOP"} <i /></p><h1>{ar ? "حقيبتك." : "Your bag."}</h1><p>{ar ? "راجع اختياراتك قبل إتمام الطلب." : "Review your picks before checkout."}</p></div>
    {!cart.length ? <div className="setup-notice wide-notice"><p>{ar ? "حقيبتك فارغة." : "Your bag is empty."}</p><Link href="/shop" className="button button-dark">{ar ? "تصفح المتجر ↗" : "Explore the shop ↗"}</Link></div> : <div className="cart-layout">
      <section className="cart-items">{cart.map(item => <article className="cart-row" key={item.id}><img src={imageUrl(item.image_source || item.image, 800, demo.media)} alt={ar ? (item.name_ar || item.name_en) : item.name_en} /><div><strong>{ar ? (item.name_ar || item.name_en) : item.name_en}</strong><small>{ar ? "ج.م" : (item.currency || "EGP")} {Number(item.price).toLocaleString(ar ? "ar-EG" : "en-EG")}</small><div className="quantity-control"><button onClick={() => setCartQuantity(item.id, item.quantity - 1)} aria-label={ar ? "إزالة قطعة" : "Remove one"}>−</button><span>{item.quantity}</span><button onClick={() => setCartQuantity(item.id, item.quantity + 1)} aria-label={ar ? "إضافة قطعة" : "Add one"}>＋</button><button className="remove-button" onClick={() => removeFromCart(item.id)}>{ar ? "حذف" : "Remove"}</button></div></div></article>)}</section>
      <aside className="price-panel"><small>{ar ? "إجمالي المنتجات" : "Items subtotal"}</small><strong>{ar ? "ج.م" : "EGP"} {number}</strong><span>{ar ? "تُحسب رسوم التوصيل عند إتمام الطلب." : "Delivery is calculated at checkout."}</span><Link href="/checkout" className="button button-dark">{ar ? "متابعة لإتمام الطلب ↗" : "Continue to checkout ↗"}</Link>{cart.some(item=>item.preview) && <small className="preview-disclaimer">{ar ? "الأسعار توضيحية في وضع المعاينة." : "Sample item prices are illustrative in preview mode."}</small>}</aside>
    </div>}
  </main>;
}
