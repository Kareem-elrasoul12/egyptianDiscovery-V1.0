import Link from "next/link";
import { createClient } from "../../src/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured } from "../../src/lib/supabase/config";
import DemoAccount from "../../src/components/demo-account";

export default async function AccountPage() {
  if (!isSupabaseConfigured()) return isDemoMode()?<DemoAccount/>:<main className="listing-page"><div className="setup-notice"><strong>Account service is not connected</strong><p>Configure Supabase to access live reservations and orders. Sample account data is disabled.</p></div></main>;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if (!user) return <main className="listing-page"><div className="page-intro"><p className="eyebrow">YOUR ACCOUNT <i/></p><h1>Welcome, explorer.</h1><p>Sign in to see reservations, payments, and rewards.</p><Link className="button button-dark" href="/login">Sign in with phone ↗</Link></div></main>;
  const [{data:profile},{data:reservations},{data:orders}] = await Promise.all([
    supabase.from("profiles").select("display_name,phone,loyalty_points,referral_code").eq("id",user.id).maybeSingle(),
    supabase.from("reservations").select("id,reference,status,seats,amount_due,amount_paid,created_at,trips(name_en,name_ar,departure_date)").eq("customer_id",user.id).order("created_at",{ascending:false}),
    supabase.from("orders").select("id,reference,status,total,created_at").eq("customer_id",user.id).order("created_at",{ascending:false}),
  ]);
  return <main className="listing-page"><div className="page-intro"><p className="eyebrow">YOUR ACCOUNT <i/></p><h1>Good to have you back{profile?.display_name?`, ${profile.display_name}`:""}.</h1><p>{profile?.phone} · {profile?.loyalty_points||0} points · referral code {profile?.referral_code}</p></div><div className="account-grid"><section className="account-panel"><h2>Reservations</h2>{reservations?.length?reservations.map(x=><article className="account-row" key={x.id}><strong>{x.trips?.name_en||"Trip reservation"}</strong><span>{x.reference} · {x.status.replaceAll("_"," ")}</span><small>{x.seats} seat(s) · EGP {Number(x.amount_paid).toLocaleString()} paid of EGP {Number(x.amount_due).toLocaleString()}</small><Link href={`/account/reservations/${x.id}`}>View details ↗</Link></article>):<p>No reservations yet. <Link href="/trips">Explore trips ↗</Link></p>}</section><section className="account-panel"><h2>Shop orders</h2>{orders?.length?orders.map(x=><article className="account-row" key={x.id}><strong>{x.reference}</strong><span>{x.status.replaceAll("_"," ")}</span><small>EGP {Number(x.total).toLocaleString()}</small></article>):<p>No orders yet. <Link href="/shop">Visit the shop ↗</Link></p>}</section></div><section className="account-panel"><h2>Traveler information</h2><p>National ID is collected only after a paid reservation is confirmed. It is stored privately and never appears on public profiles.</p></section></main>;
}
