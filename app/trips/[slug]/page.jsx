import { notFound } from "next/navigation";
import { getPublicTrips } from "../../../src/lib/data/public";
import TripDetailClient from "../../../src/components/trip-detail-client";
import DemoTripPage from "../../../src/components/demo-trip-page";
import {isDemoMode, isSupabaseConfigured} from "../../../src/lib/supabase/config";

export default async function TripDetailPage({params}) {
  const {slug}=await params;
  if(!isSupabaseConfigured()) { if(isDemoMode()) return <DemoTripPage slug={slug}/>; notFound(); }
  const trips=await getPublicTrips();
  const trip=trips.find(item=>item.id===slug);
  if(!trip) notFound();
  return <TripDetailClient trip={trip}/>;
}
