"use client";
import Link from "next/link";
import {useSite} from "./site-context";
import TripDetailClient from "./trip-detail-client";
import {isSupabaseConfigured} from "../lib/supabase/config";
export default function DemoTripPage({slug}){
 const {demo,demoReady}=useSite();
 if(isSupabaseConfigured())return null;
 if(!demoReady)return <main className="listing-page">Loading journey…</main>;
 const item=demo.trips.find(x=>x.id===slug||x.slug===slug);
 if(!item)return <main className="listing-page"><h1>Journey not found.</h1><Link href="/trips">Back to all journeys ↗</Link></main>;
 const trip={...item,id:item.id,name:item.name,ar:item.ar||item.name,place:item.place||"Egypt",placeAr:item.placeAr||item.place||"مصر",type:item.type||"Multi-day",typeAr:item.typeAr||item.type||"رحلة متعددة الأيام",duration:item.duration||`${item.duration_days||1} days`,durationAr:item.durationAr||`${item.duration_days||1} أيام`,price:item.price||`EGP ${Number(item.priceValue||0).toLocaleString()}`,date:item.date||item.departure_date||item.preferred_dates?.[0],dateAr:item.dateAr||item.date||item.departure_date||item.preferred_dates?.[0],image:item.image||"photo-1470770841072-f978cf4d019e",images:item.images||[],description:item.description||"",descriptionAr:item.descriptionAr||"",note:item.note||"A journey beyond the everyday",noteAr:item.noteAr||item.note||"رحلة خارج المألوف",preview:true,paidTravelers:item.paidTravelers||0,min_travelers:item.min_travelers||13,max_capacity:item.max_capacity||24,status:item.status||"gathering",preferred_dates:item.preferred_dates||[]};
 return <TripDetailClient trip={trip}/>;
}
