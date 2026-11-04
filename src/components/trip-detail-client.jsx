"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { imageUrl } from "../data/content";
import { useSite } from "./site-context";
import { createClient } from "../lib/supabase/client";
import { isDemoMode } from "../lib/supabase/config";
import {useEffect} from "react";

export default function TripDetailClient({trip}) {
  const {t,lang,demo,createReservation:makeDemoReservation,joinWaitlist:joinDemoWaitlist}=useSite();
  const router=useRouter();
  const [seats,setSeats]=useState(1);
  const [preferredDates,setPreferredDates]=useState([]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [hold,setHold]=useState(null),[waitlisted,setWaitlisted]=useState(false);
  const [canReview,setCanReview]=useState(false),[rating,setRating]=useState(5),[review,setReview]=useState(""),[reviewMessage,setReviewMessage]=useState("");
  const holdHours=isDemoMode()?(Number(demo.settings.reservation_hold_hours)||12):12;
  useEffect(()=>{if(!trip.dbId)return;let active=true;async function check(){const supabase=createClient();if(!supabase)return;const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {data}=await supabase.from("reservations").select("id").eq("trip_id",trip.dbId).eq("customer_id",user.id).eq("status","confirmed").limit(1);if(active)setCanReview(Boolean(data?.length));}check();return()=>{active=false};},[trip.dbId]);
  async function reserve(){
    setBusy(true);setMessage("");
    try {
      const supabase=createClient();
      if(isDemoMode()){if(!preferredDates.length)throw new Error("Choose at least one preferred travel date.");const reservation=makeDemoReservation(trip.id,Number(seats),preferredDates);setHold(reservation);setMessage(`Demo reservation created. Your ${holdHours}-hour hold is active; submit your transfer proof from your account to continue.`);return;}
      if(!supabase)throw new Error("Reservations are unavailable until Supabase is configured.");
      const {data:{user},error:authError}=await supabase.auth.getUser();
      if(authError||!user){router.push("/login?next="+encodeURIComponent("/trips/"+trip.id));return;}
      if(!preferredDates.length)throw new Error("Choose at least one preferred travel date.");
      const {data,error}=await supabase.rpc("create_reservation",{p_trip_id:trip.dbId,p_seats:Number(seats),p_preferred_dates:preferredDates});
      if(error)throw error;
      setHold(data);
      setMessage("Your 12-hour seat hold is active. Send your deposit proof from your account to enter payment review; the trip is not confirmed until the team approves it.");
    } catch(error){setMessage(error.message||"We could not create the reservation.");}
    finally{setBusy(false);}
  }
  async function joinWaitlist(){setBusy(true);setMessage("");try{const supabase=createClient();if(isDemoMode()){joinDemoWaitlist(trip.id,Number(seats),preferredDates);setWaitlisted(true);setMessage("You’re on the demo waitlist. The dashboard can review this request.");return;}if(!supabase)throw new Error("Waitlist is unavailable until Supabase is configured.");const {data:{user}}=await supabase.auth.getUser();if(!user){router.push("/login?next="+encodeURIComponent("/trips/"+trip.id));return;}const {error}=await supabase.rpc("join_trip_waitlist",{p_trip_id:trip.dbId,p_seats:Number(seats),p_preferred_dates:preferredDates});if(error)throw error;setWaitlisted(true);setMessage("You’re on the waitlist. The travel team will contact you if a place opens; joining does not confirm a booking.");}catch(e){setMessage(e.message||"Could not join the waitlist.");}finally{setBusy(false);}}
  async function submitReview(e){e.preventDefault();setReviewMessage("");try{const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Sign in with a confirmed reservation to leave a review.");const {error}=await supabase.from("reviews").insert({customer_id:user.id,trip_id:trip.dbId,rating,review_en:review.trim(),status:"pending"});if(error)throw error;setReview("");setCanReview(false);setReviewMessage("Thanks. Your review is saved and will appear after the team approves it.");}catch(error){setReviewMessage(error.message||"Review could not be submitted.");}}
  const image=imageUrl(trip.image,1800,demo.media);
  function shareTrip(){const url=`${window.location.origin}/trips/${trip.id}`;window.open(`https://wa.me/?text=${encodeURIComponent(`Explore ${trip.name} with Egyptian Discovery: ${url}`)}`,"_blank","noopener,noreferrer");}
   return <main className="detail-page"><Link href="/trips" className="back-link">← {t("back")}</Link><div className="detail-hero"><img src={image} alt={lang==="ar"?trip.ar:trip.name}/><div><p className="eyebrow light">{lang==="ar"?trip.placeAr:trip.place} · {lang==="ar"?trip.durationAr:trip.duration}</p><h1>{lang==="ar"?trip.ar:trip.name}</h1><p>{t("tripDetail")}</p><button className="share-button" onClick={shareTrip}>Share this trip on WhatsApp ↗</button></div></div>{(trip.images||[]).filter(source=>source&&source!==trip.image).length>0&&<section className="trip-photo-gallery" aria-label="More trip photos">{trip.images.filter(source=>source&&source!==trip.image).map((source,index)=><img key={`${source}-${index}`} src={imageUrl(source,1100,demo.media)} alt={`${trip.name} photo ${index+2}`} loading="lazy"/>)}</section>}<div className="trip-detail-content"><div><p className="eyebrow">{t("highlights")} <i/></p><h2>{lang==="ar"?trip.noteAr:trip.note}</h2>{(lang==="ar"?trip.descriptionAr:trip.description)?<p>{lang==="ar"?trip.descriptionAr:trip.description}</p>:<p>{trip.preview?"Demo journey · prices and dates are illustrative. Actions run in this browser’s local demo workspace.":"Reservations begin with a 12-hour hold and deposit review. The trip is only confirmed after manual agency approval."}</p>}<div className="trip-demand"><strong>{trip.paidTravelers||0} / {trip.min_travelers||13} paid travelers</strong><span>{trip.status?.replaceAll("_"," ")||"gathering travelers"}</span><progress max={trip.min_travelers||13} value={trip.paidTravelers||0}/></div><div className="trip-policy"><strong>Booking steps</strong><ol><li>Choose one or more preferred travel dates and the number of travelers.</li><li>Place a temporary hold and submit an InstaPay or bank transfer deposit.</li><li>The team reviews the payment and confirms the trip after the paid group minimum is reached.</li><li>National ID is requested only after payment and trip confirmation.</li></ol></div>{canReview&&<form className="stack-form review-form" onSubmit={submitReview}><h3>Share a note from your trip</h3><label>Rating<select value={rating} onChange={e=>setRating(Number(e.target.value))}>{[5,4,3,2,1].map(n=><option value={n} key={n}>{n} stars</option>)}</select></label><label>Your review<textarea required minLength="10" maxLength="1200" value={review} onChange={e=>setReview(e.target.value)}/></label><button className="button button-dark">Submit for review ↗</button></form>}{reviewMessage&&<p className="form-message" role="status">{reviewMessage}</p>}</div><div className="price-panel"><small>{t("from")}</small><strong>{trip.price}</strong><span>{lang==="ar"?trip.dateAr:trip.date}</span>{trip.preview&&<span className="preview-disclaimer">DEMO PREVIEW · SAMPLE AMOUNT</span>}<label className="seat-select">Seats<select value={seats} onChange={event=>setSeats(event.target.value)}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label><fieldset className="date-picker"><legend>Preferred dates</legend>{(trip.preferred_dates||[]).map(date=><label key={date}><input type="checkbox" checked={preferredDates.includes(date)} onChange={e=>setPreferredDates(prev=>e.target.checked?[...prev,date]:prev.filter(x=>x!==date))}/>{date}</label>)}</fieldset><button className="button button-dark" onClick={reserve} disabled={busy||Boolean(hold)||waitlisted}>{busy?"Creating hold…":hold?`${holdHours}-hour hold active`:`Hold seats for ${holdHours} hours`} ↗</button><button className="text-link waitlist-button" onClick={joinWaitlist} disabled={busy||waitlisted}>{waitlisted?"Joined waitlist":"Join waitlist"} ↗</button>{message&&<p className="form-message" role="status">{message}</p>}</div></div></main>;
}
