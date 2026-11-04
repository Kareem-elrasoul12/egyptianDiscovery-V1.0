import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { createClient } from "../../../../src/lib/supabase/server";
import { isSupabaseConfigured } from "../../../../src/lib/supabase/config";
import ReservationPaymentForm from "../../../../src/components/reservation-payment-form";
import TravelerForm from "../../../../src/components/traveler-form";
import ReservationActions from "../../../../src/components/reservation-actions";

export default async function ReservationPage({params}) {
  if(!isSupabaseConfigured()) redirect("/account");
  const {id}=await params;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:reservation}=await supabase.from("reservations").select("id,reference,status,seats,amount_due,deposit_due,amount_paid,held_until,balance_due_at,trips(name_en,name_ar,departure_date),travelers(id,full_name,phone,date_of_birth),date_decisions(id,proposed_date,decision)").eq("id",id).eq("customer_id",user.id).maybeSingle();
  if(!reservation) notFound();
  const {data:payments}=await supabase.from("payments").select("id,amount,method,status,created_at,receipts(id,receipt_number)").eq("reservation_id",id).eq("customer_id",user.id).order("created_at",{ascending:false});
  return <main className="listing-page"><Link href="/account" className="back-link">← Account</Link><div className="page-intro"><p className="eyebrow">RESERVATION {reservation.reference} <i/></p><h1>{reservation.trips?.name_en||"Your trip"}</h1><p>{reservation.status.replaceAll("_"," ")} · {reservation.seats} seat(s)</p></div><ReservationActions reservationId={reservation.id} status={reservation.status} decisions={(reservation.date_decisions||[]).filter(d=>d.decision==="pending")}/><div className="account-grid"><section className="account-panel"><h2>Payments</h2><p>Total trip price: EGP {Number(reservation.amount_due).toLocaleString()} · required deposit: EGP {Number(reservation.deposit_due).toLocaleString()} · recorded paid: EGP {Number(reservation.amount_paid).toLocaleString()}</p>{reservation.balance_due_at&&<p>Remaining balance due by {new Date(reservation.balance_due_at).toLocaleDateString()}.</p>}<p>Transfers are checked manually. Payment proof does not confirm a trip. The team confirms reservations after review and the trip’s minimum group requirement is met.</p>{!['cancelled','expired','refunded','fully_paid','completed'].includes(reservation.status)&&<ReservationPaymentForm reservation={reservation} paid={Number(reservation.amount_paid)||0}/>}</section><section className="account-panel"><h2>Payment activity</h2>{payments?.length?payments.map(x=><article className="account-row" key={x.id}><strong>EGP {Number(x.amount).toLocaleString()} · {x.method.replaceAll("_"," ")}</strong><span>{x.status.replaceAll("_"," ")}</span><small>{new Date(x.created_at).toLocaleString()}</small>{x.receipts?.[0]&&<Link href={`/account/receipts/${x.receipts[0].id}`}>Receipt {x.receipts[0].receipt_number} ↗</Link>}</article>):<p>No payment submitted yet.</p>}</section></div><section className="account-panel"><h2>Traveler details</h2><p>National ID is requested only after your trip is paid and confirmed. The ID is encrypted in the database and visible only to authorized administrators.</p>{reservation.travelers?.map((traveler,index)=><article className="account-row" key={traveler.id}><strong>Traveler {index+1} · {traveler.full_name}</strong><small>{traveler.phone||"Phone not provided"}</small></article>)}{["confirmed","fully_paid"].includes(reservation.status)&&reservation.amount_paid>0&&<TravelerForm reservationId={reservation.id} remaining={Math.max(0,reservation.seats-(reservation.travelers?.length||0))}/>}</section></main>;
}
