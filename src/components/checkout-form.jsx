"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {useSite} from "./site-context";
import {createClient} from "../lib/supabase/client";
import {isDemoMode, isSupabaseConfigured} from "../lib/supabase/config";
export default function CheckoutForm({governorates}){
 const {cart,clearCart,createOrder,demo}=useSite();const router=useRouter();const [name,setName]=useState("");const [phone,setPhone]=useState("");const [address,setAddress]=useState("");const [governorate,setGovernorate]=useState(governorates[0]?.code||"");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 const selected=governorates.find(x=>x.code===governorate);const localDeliveryFee=Number(demo.settings[`delivery_fee_${String(governorate).toLowerCase()}`]??demo.settings.delivery_fee_other??selected?.delivery_fee??0);const deliveryFee=isDemoMode()?localDeliveryFee:Number(selected?.delivery_fee||0);const subtotal=useMemo(()=>cart.reduce((s,x)=>s+Number(x.price)*x.quantity,0),[cart]);
 async function submit(event){event.preventDefault();setMessage("");setBusy(true);try{
  if(isDemoMode()){const order=createOrder({name,phone,address,governorate});router.push(`/account?order=${order.id}`);return;}
  if(!isSupabaseConfigured())throw new Error("Checkout is unavailable until Supabase is configured.");
  if(cart.some(item=>item.preview||!item.dbId))throw new Error("Live checkout is not connected for these preview items. Configure Supabase and publish products to enable ordering.");
  const supabase=createClient();const {data:{user},error:authError}=await supabase.auth.getUser();if(authError||!user){router.push("/login?next=/checkout");return;}
  const {data,error}=await supabase.rpc("create_store_order",{p_governorate_code:governorate,p_address:address,p_recipient_name:name,p_recipient_phone:phone,p_items:cart.map(item=>({product_id:item.dbId,quantity:item.quantity}))});if(error)throw error;
  clearCart();router.push(`/account/orders/${data.id}`);
 }catch(e){setMessage(e.message||"Checkout could not be completed.");}finally{setBusy(false);}}
 return <main className="listing-page"><div className="page-intro"><p className="eyebrow">FIELD SHOP <i/></p><h1>Delivery details.</h1><p>Products, available stock, and delivery fees are checked again securely at checkout.</p></div>{!cart.length?<div className="setup-notice wide-notice"><p>Your bag is empty.</p><Link href="/shop" className="button button-dark">Return to shop ↗</Link></div>:<div className="cart-layout"><form className="stack-form checkout-form" onSubmit={submit}><label>Recipient name<input required minLength="2" value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label><label>Delivery phone<input required minLength="7" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} autoComplete="tel"/></label><label>Governorate<select required value={governorate} onChange={e=>setGovernorate(e.target.value)}>{governorates.map(g=><option value={g.code} key={g.code}>{g.name_en}</option>)}</select></label><label>Street address<input required minLength="5" value={address} onChange={e=>setAddress(e.target.value)} autoComplete="street-address"/></label><div className="order-summary"><span>Item subtotal <b>EGP {subtotal.toLocaleString()}</b></span><span>Delivery <b>EGP {deliveryFee.toLocaleString()}</b></span><span>Total <b>EGP {(subtotal+deliveryFee).toLocaleString()}</b></span></div><button className="button button-dark" disabled={busy}>{busy?"Checking order…":"Place order"} ↗</button>{message&&<p className="form-message" role="alert">{message}</p>}</form><aside className="setup-notice"><strong>LOCAL DEMO PAYMENT</strong><p>Checkout creates a sample order. From your demo account, submit a sample transfer and review it in the operations dashboard.</p><Link href="/cart">Edit bag ↗</Link></aside></div>}</main>
}
